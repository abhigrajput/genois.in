'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/authStore';
import { api } from '@/lib/api';

export default function RazorpayButton({ plan, amount: propAmount, label, onSuccess, className }) {
  const [loading, setLoading] = useState(false);
  const { user, updateUser } = useAuthStore();

  function loadRazorpayScript() {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  const handlePayment = async () => {
    setLoading(true);
    try {
      let finalPlan = plan;
      let finalAmount = propAmount || 0;
      if (plan === 'basic' || plan === 'player') { finalPlan = 'player'; finalAmount = 99; }
      else if (plan === 'pro' || plan === 'performer') { finalPlan = 'performer'; finalAmount = 199; }
      else if (plan === 'elite' || plan === 'dominator') { finalPlan = 'dominator'; finalAmount = 499; }

      // Step 1: Create Razorpay order on server
      const orderRes = await api.post('/api/payment/create-order', { plan: finalPlan, amount: finalAmount });
      const { orderId, amount, currency, keyId } = orderRes.data;

      // Step 2: Load Razorpay checkout script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Failed to load payment gateway. Check your internet connection.');
        setLoading(false);
        return;
      }

      // Step 3: Open Razorpay checkout modal
      const options = {
        key: keyId,
        amount,
        currency,
        name: 'GENOIS Career OS',
        description: `GENOIS Premium — ${plan === 'annual' ? 'Annual' : 'Monthly'}`,
        image: '/logo.png',
        order_id: orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#7F77DD',
          backdrop_color: 'rgba(0,0,0,0.5)',
        },
        handler: async function (response) {
          try {
            const verifyRes = await api.post('/api/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: finalPlan,
              amount,
            });
            if (verifyRes.data.verified) {
              updateUser({ plan: 'premium' });
              toast.success('🎉 Premium activated! +100 bonus points!', { duration: 5000 });
              if (onSuccess) onSuccess();
            }
          } catch (err) {
            toast.error('Payment verification failed. Contact support@genois.app');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast('Payment cancelled.', { icon: 'ℹ️' });
          },
          confirm_close: true,
          escape: false,
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        toast.error(`Payment failed: ${response.error.description}`);
        setLoading(false);
      });
      rzp.open();

    } catch (error) {
      toast.error(error.message || 'Payment setup failed. Try again.');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className={className || 'btn-primary'}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
          </svg>
          Processing...
        </span>
      ) : label || 'Upgrade to Premium'}
    </button>
  );
}

import { getAdminClient } from '@/lib/supabaseAdmin';
import { successResponse, errorResponse } from '@/lib/response';

export async function POST(request) {
  try {
    const { auctionId, recruiterName, recruiterCompany, recruiterEmail, bidAmount, message } = await request.json();
    
    if (!auctionId || !bidAmount || !recruiterCompany) {
      return errorResponse('Missing required fields', 400);
    }
    
    const supabase = getAdminClient();
    
    const { data: auction } = await supabase
      .from('skill_auction')
      .select('*')
      .eq('id', auctionId)
      .single();
      
    if (!auction) return errorResponse('Auction not found', 404);
    
    if (bidAmount <= auction.current_bid) {
      return errorResponse('Bid must be higher than current bid: ₹' + auction.current_bid, 400);
    }
    
    // Insert bid
    await supabase.from('auction_bids').insert({
      auction_id: auctionId,
      recruiter_name: recruiterName,
      recruiter_company: recruiterCompany,
      recruiter_email: recruiterEmail,
      bid_amount: bidAmount,
      message: message || ''
    });
    
    // Update auction
    await supabase.from('skill_auction').update({
      current_bid: bidAmount,
      bid_count: supabase.sql`bid_count + 1`,
      updated_at: new Date().toISOString()
    }).eq('id', auctionId);

    return successResponse({ message: 'Bid placed successfully!' });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const supabase = getAdminClient();
    
    // We get all currently listed auctions
    const { data: auctions } = await supabase
      .from('skill_auction')
      .select('*')
      .eq('is_listed', true)
      .order('current_bid', { ascending: false });

    // We join the user information
    const enriched = await Promise.all((auctions || []).map(async (auction) => {
      const { data: user } = await supabase
        .from('users')
        .select('name, college, domain_slug')
        .eq('id', auction.user_id)
        .single();
        
      const { data: score } = await supabase
        .from('scores')
        .select('total_score')
        .eq('user_id', auction.user_id)
        .single();
        
      return {
        ...auction,
        name: user?.name,
        college: user?.college,
        domain: user?.domain_slug,
        score: score?.total_score || 0,
      };
    }));

    // We can also let the current logged-in user check their status:
    const payload = await getUserFromRequest(request).catch(() => null);
    let myAuction = null;
    let myScore = 0;
    if (payload) {
      const { data: myAcct } = await supabase
        .from('skill_auction')
        .select('*')
        .eq('user_id', payload.userId)
        .single();
      myAuction = myAcct;
      
      const { data: mScore } = await supabase.from('scores').select('total_score').eq('user_id', payload.userId).single();
      myScore = mScore?.total_score || 0;
    }
    
    return successResponse({ 
      auctions: enriched,
      myAuction,
      myScore
    });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    
    const { minBid } = await request.json();
    const supabase = getAdminClient();
    
    // Check score threshold
    const { data: score } = await supabase
      .from('scores')
      .select('total_score')
      .eq('user_id', payload.userId)
      .single();
      
    if ((score?.total_score || 0) < 1500) {
      return errorResponse('You need at least 1500 points to list on the Skill Auction.', 403);
    }

    const { data: existing } = await supabase
      .from('skill_auction')
      .select('id')
      .eq('user_id', payload.userId)
      .single();
      
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

    if (existing) {
      await supabase
        .from('skill_auction')
        .update({ is_listed: true, min_bid: minBid || 0, auction_month: currentMonth })
        .eq('user_id', payload.userId);
    } else {
      await supabase
        .from('skill_auction')
        .insert({ 
          user_id: payload.userId, 
          is_listed: true, 
          min_bid: minBid || 0,
          current_bid: minBid || 0,
          auction_month: currentMonth 
        });
    }

    return successResponse({ message: 'You are now listed on the auction block!' });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

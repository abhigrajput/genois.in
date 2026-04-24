import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

const PACK_CONTENT = {
  tcs: {
    company: 'TCS',
    fullName: 'Tata Consultancy Services',
    color: '#3366CC',
    logo: '🔷',
    testName: 'TCS NQT (National Qualifier Test)',
    overview: 'TCS NQT is conducted twice a year. It tests aptitude, reasoning, verbal ability, programming logic and coding. Minimum score varies by year but typically 50-60% is safe for shortlisting.',
    sections: [
      { name: 'Numerical Ability', weight: '20%', topics: ['Number Series', 'Percentages', 'Profit and Loss', 'Time Speed Distance', 'Data Interpretation', 'Averages', 'Ratios'], tips: 'Practice speed calculation. Most questions are doable in under 60 seconds if you know shortcuts.' },
      { name: 'Verbal Ability', weight: '15%', topics: ['Reading Comprehension', 'Error Spotting', 'Sentence Completion', 'Synonyms and Antonyms', 'Para Jumbles'], tips: 'Read 1 English article per day for 2 weeks. Focus on RC since it carries most marks.' },
      { name: 'Reasoning Ability', weight: '25%', topics: ['Blood Relations', 'Seating Arrangements', 'Syllogisms', 'Coding Decoding', 'Direction Sense', 'Puzzles'], tips: 'Seating arrangements and puzzles take time. Attempt them last if time is short.' },
      { name: 'Programming Logic', weight: '20%', topics: ['Output prediction', 'Algorithm tracing', 'Complexity analysis', 'Flowcharts', 'Basic data structures'], tips: 'No actual coding in this section. Focus on reading code and predicting output.' },
      { name: 'Coding', weight: '20%', topics: ['Array manipulation', 'String problems', 'Basic math problems', 'Pattern printing', 'Simple recursion'], tips: 'Choose Python or Java. Solve at least 100 easy LeetCode problems before the exam.' },
    ],
    strategy: [
      'Start preparation 3 months before the exam date',
      'Solve 20 aptitude questions daily — IndiaBix is the best resource',
      'Do 2 LeetCode easy problems per day for the coding section',
      'Attempt previous year TCS NQT papers available on PrepInsta',
      'Time management is key — do not spend more than 90 seconds on any aptitude question',
      'The coding section allows any language — choose what you are most comfortable with',
    ],
    cutoff: 'Typically 50-65% overall. Each section may have individual cutoffs.',
    timeline: '3 months: Month 1 — Aptitude basics. Month 2 — Practice papers. Month 3 — Full mocks.',
  },
  infosys: {
    company: 'Infosys',
    fullName: 'Infosys Limited',
    color: '#007CC3',
    logo: '🔵',
    testName: 'Infosys InfyTQ + Placement Test',
    overview: 'Infosys has two tracks — InfyTQ certification (online year-round) and campus placement. InfyTQ certified students get direct placement consideration. The campus test has aptitude, reasoning and coding sections.',
    sections: [
      { name: 'Quantitative Aptitude', weight: '25%', topics: ['Permutation Combination', 'Probability', 'Number System', 'Age Problems', 'Work and Time', 'Pipes and Cisterns', 'Geometry basics'], tips: 'Infosys aptitude is harder than TCS. Permutation and probability appear every year.' },
      { name: 'Logical Reasoning', weight: '25%', topics: ['Data Sufficiency', 'Statement and Conclusion', 'Input Output', 'Matrix puzzles', 'Venn Diagrams'], tips: 'Data sufficiency is unique to Infosys among service companies. Practice specifically.' },
      { name: 'Verbal English', weight: '20%', topics: ['Reading Comprehension', 'Sentence Correction', 'Fill in the blanks', 'Vocabulary', 'Critical Reasoning'], tips: 'Critical reasoning is often confusing. Read options very carefully before answering.' },
      { name: 'Coding', weight: '30%', topics: ['Arrays and Strings', 'Functions and recursion', 'Matrix operations', 'Sorting implementations', 'Mathematical functions'], tips: 'Infosys coding is moderately difficult. Focus on clean working code over optimization.' },
    ],
    strategy: [
      'Get InfyTQ certified first — it gives direct placement advantage',
      'InfyTQ has free courses on Python and database — complete them for the certification',
      'For aptitude focus on P&C and probability as they appear every year',
      'Practice data sufficiency specifically as it does not appear in other company tests',
      'For coding practice medium difficulty problems on HackerRank',
      'Interview round focuses heavily on projects and basics — know your resume thoroughly',
    ],
    cutoff: 'Usually 60-70% for written test. InfyTQ certification score also considered.',
    timeline: '4 months: Month 1-2 — InfyTQ certification. Month 3 — Aptitude prep. Month 4 — Mock tests.',
  },
  wipro: {
    company: 'Wipro',
    fullName: 'Wipro Limited',
    color: '#341C5C',
    logo: '🟣',
    testName: 'Wipro NLTH (National Level Talent Hunt)',
    overview: 'Wipro NLTH is conducted multiple times per year. It has online aptitude and coding followed by an essay writing section which most students overlook. The overall difficulty is moderate and preparation time is 6-8 weeks.',
    sections: [
      { name: 'Quantitative Aptitude', weight: '30%', topics: ['Simple and Compound Interest', 'Mensuration', 'Number Series', 'Time and Work', 'Profit Loss Discount', 'Speed Distance Time', 'Mixtures'], tips: 'Wipro aptitude is moderate. Basic formulas and speed is enough for most questions.' },
      { name: 'Logical Reasoning', weight: '30%', topics: ['Analogies', 'Number Series', 'Odd One Out', 'Classification', 'Coding Decoding', 'Blood Relations'], tips: 'These are straightforward if you practice basic reasoning patterns for 2 weeks.' },
      { name: 'Essay Writing', weight: '15%', topics: ['Technology topics', 'Social issues', 'Current events', 'Opinion essays'], tips: 'Most students ignore this. A good essay of 200-250 words can differentiate you easily.' },
      { name: 'Coding', weight: '25%', topics: ['String manipulation', 'Array problems', 'Number patterns', 'Basic OOP concepts', 'Simple algorithms'], tips: 'Wipro coding is easier than TCS and Infosys. 20-30 LeetCode easy problems is sufficient.' },
    ],
    strategy: [
      'Wipro is the most achievable among the big 3 service companies',
      'Focus on essay writing — most candidates skip this and it is easy marks',
      'Practice basic aptitude for 1 hour daily for 6 weeks',
      'For coding do 30 LeetCode easy problems focusing on strings and arrays',
      'Interview round is largely HR focused — prepare why Wipro and tell me about yourself',
      'Multiple assessment windows per year so you can attempt multiple times',
    ],
    cutoff: 'Around 50-55% overall. Essay is evaluated separately.',
    timeline: '6 weeks: Week 1-3 — Aptitude. Week 4-5 — Coding. Week 6 — Mock tests and essay practice.',
  },
};

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const { searchParams } = new URL(request.url);
    const company = searchParams.get('company')?.toLowerCase();

    if (!company || !PACK_CONTENT[company]) {
      return errorResponse('Invalid company', 400);
    }

    const supabase = getAdminClient();
    const { data: purchase } = await supabase
      .from('prep_packs')
      .select('id')
      .eq('user_id', payload.userId)
      .eq('company', company)
      .single();

    if (!purchase) {
      return errorResponse('Pack not purchased', 403);
    }

    return successResponse({ pack: PACK_CONTENT[company] });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

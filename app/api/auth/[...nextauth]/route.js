import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { generateToken } from '@/lib/auth';

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account.provider !== 'google') return true;
      try {
        const supabase = getAdminClient();
        const { data: existing } = await supabase
          .from('users')
          .select('id, email')
          .eq('email', user.email.toLowerCase())
          .single();

        if (existing) {
          await supabase.from('users')
            .update({ email_verified: true })
            .eq('id', existing.id);
          return true;
        }

        // Create new user
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 30);

        const { data: newUser, error } = await supabase
          .from('users')
          .insert({
            email: user.email.toLowerCase(),
            name: user.name || user.email.split('@')[0],
            password_hash: 'google_oauth_no_password',
            email_verified: true,
            subscription_plan: 'spectator',
            trial_ends_at: trialEnd.toISOString(),
            is_on_trial: true,
          })
          .select()
          .single();

        if (error) throw new Error(error.message);

        if (newUser?.id) {
          await Promise.all([
            supabase.from('scores').insert({ user_id: newUser.id }).catch(() => {}),
            supabase.from('progress').insert({ user_id: newUser.id, streak: 0, current_day: 1 }).catch(() => {}),
            supabase.from('skill_identity').insert({ user_id: newUser.id }).catch(() => {}),
          ]);
        }

        return true;
      } catch (e) {
        console.error('[NextAuth] Google signIn error:', e.message);
        return '/login?error=OAuthSignIn';
      }
    },

    async jwt({ token, user, account }) {
      // Only runs on first sign-in when account is available
      if (account?.provider === 'google' && user?.email) {
        try {
          const supabase = getAdminClient();
          const { data: dbUser } = await supabase
            .from('users')
            .select('id, name, email, subscription_plan, domain_slug, is_on_trial, trial_ends_at')
            .eq('email', user.email.toLowerCase())
            .single();

          if (dbUser) {
            token.userId = dbUser.id;
            token.genoisToken = generateToken({ userId: dbUser.id });
            token.isNewUser = !dbUser.domain_slug;
            token.userName = dbUser.name;
            token.userEmail = dbUser.email;
            token.plan = dbUser.subscription_plan;
          }
        } catch (e) {
          console.error('[NextAuth] JWT callback error:', e.message);
        }
      }
      return token;
    },

    async session({ session, token }) {
      session.userId = token.userId;
      session.genoisToken = token.genoisToken;
      session.isNewUser = token.isNewUser;
      session.userName = token.userName;
      session.userEmail = token.userEmail;
      session.plan = token.plan;
      return session;
    },

    // Redirect after sign-in: go to /auth/google-callback which handles cookie + Zustand hydration.
    // Guard: if the resolved destination is the sign-in page itself (default when no callbackUrl
    // was passed), override to /auth/google-callback to avoid a sign-in → login redirect loop.
    async redirect({ url, baseUrl }) {
      const dest = url.startsWith(baseUrl) ? url
        : url.startsWith('/') ? `${baseUrl}${url}`
        : `${baseUrl}/auth/google-callback`;

      const loginUrl = `${baseUrl}/login`;
      if (dest === loginUrl || dest === baseUrl || dest === `${baseUrl}/`) {
        return `${baseUrl}/auth/google-callback`;
      }
      return dest;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
export { authOptions };

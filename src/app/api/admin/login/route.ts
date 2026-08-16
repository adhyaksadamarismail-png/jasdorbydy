import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    // Default admin credentials: admin / admin123
    const validUser = process.env.ADMIN_USERNAME || 'admin';
    const validPass = process.env.ADMIN_PASSWORD || 'admin123';

    if (username === validUser && password === validPass) {
      const response = NextResponse.json({ success: true, message: 'Login successful' });
      // Set admin session cookie
      response.cookies.set('jasdor_admin_session', 'authenticated_token_998', {
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      return response;
    } else {
      return NextResponse.json({ success: false, message: 'Username atau password salah!' }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

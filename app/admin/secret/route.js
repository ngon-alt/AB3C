import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

const ADMIN_EMAIL = 'webconsultant2022@gmail.com';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.email !== ADMIN_EMAIL) {
    return Response.json({ error: '認証エラー' }, { status: 401 });
  }
  return Response.json({ secret: process.env.ADMIN_SECRET });
}

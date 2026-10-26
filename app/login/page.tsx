import { login } from './actions';

export default function LoginPage() {
  return (
    <form action={login}>
      <h1>Sign in</h1>
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />
      <button>Sign in</button>
    </form>
  );
}

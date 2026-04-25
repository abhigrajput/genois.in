async function test() {
  const login = await fetch('https://www.genois.in/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'abhigrajput5@gmail.com', password: 'Shiva2004' }),
  });
  const token = (await login.json()).data?.token;
  
  const r = await fetch('https://www.genois.in/api/subscription/status', {
    headers: { Authorization: 'Bearer ' + token },
  });
  console.log('Status:', r.status);
  const d = await r.json();
  console.log('Response:');
  console.log(JSON.stringify(d, null, 2));
}

test();

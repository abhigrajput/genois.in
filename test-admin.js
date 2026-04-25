async function test() {
  const login = await fetch('https://www.genois.in/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'abhigrajput5@gmail.com', password: 'Shiva2004' }),
  });
  const token = (await login.json()).data?.token;
  console.log('Token:', token ? 'OK' : 'FAIL');
  
  const r = await fetch('https://www.genois.in/api/admin', {
    headers: { Authorization: 'Bearer ' + token },
  });
  console.log('Status:', r.status);
  const d = await r.json();
  console.log('Response:', JSON.stringify(d).substring(0, 500));
}

test();

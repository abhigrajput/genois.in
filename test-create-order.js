async function test() {
  const login = await fetch('https://www.genois.in/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'abhigrajput5@gmail.com', password: 'Shiva2004' }),
  });
  const token = (await login.json()).data?.token;
  
  const r = await fetch('https://www.genois.in/api/payment/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ amount: 199, plan: 'performer' })
  });
  console.log('Status:', r.status);
  const d = await r.json();
  console.log('Response:');
  console.log(JSON.stringify(d, null, 2));
}

test();

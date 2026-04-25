const SECRET = 'DzY4JrPahjfEqbuRQt2O3xlKeCkX8SUs';

async function test() {
  console.log('Testing trial-reminder...');
  const r1 = await fetch('https://www.genois.in/api/cron/trial-reminder', {
    headers: { Authorization: 'Bearer ' + SECRET },
  });
  console.log('Status:', r1.status);
  console.log('Response:', await r1.text());

  console.log('\nTesting expire-trials...');
  const r2 = await fetch('https://www.genois.in/api/cron/expire-trials', {
    headers: { Authorization: 'Bearer ' + SECRET },
  });
  console.log('Status:', r2.status);
  console.log('Response:', await r2.text());
}

test();

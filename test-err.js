const fetch = require('node-fetch');
async function test() {
  const res = new fetch.Response('<html>NOT_FOUND</html>', { status: 404, statusText: 'Not Found' });
  try {
    await res.json();
  } catch(e) {
    console.log("JSON parse failed");
    await res.text();
  }
}
test().catch(console.error);

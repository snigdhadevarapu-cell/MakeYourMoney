const https = require('https');
const fs = require('fs');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        download(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

Promise.all([
  download('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1024&h=1024&q=80', 'public/promo1.png'),
  download('https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=1024&h=1024&q=80', 'public/promo2.png'),
  download('https://images.unsplash.com/photo-1555529771-835f59bfc50c?auto=format&fit=crop&w=512&h=512&q=80', 'public/app-icon-real.png')
]).then(() => console.log('Downloaded real pictures successfully')).catch(console.error);

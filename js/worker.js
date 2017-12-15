const fs = require('fs');

const UPNG = require('./UPNG');

process.on('message', msg => {
  if (msg.cmd === 'compress') {
    console.log(msg);
    workerMain(msg).then(res => {
      if (!res) console.error('Something is wrong!');

      // Notify the main process.
      process.send({ res });
    });
  }
  
  if (msg.cmd === 'exit') {
    process.exit(0);
  }
});

async function workerMain(msg) {
  // TODO: Node.js built-in APIs does not support async/await syntax,
  // in another word, we need some library to thunkify those APIs.
  // But we decide to use the synchronized version for now, because
  // this process is just a fuckin worker. LOL

  if (!msg) {
    // Invalid message, just ignore it.
    return;
  }

  const src = msg.src;
  const dst = msg.dst;
  const q = msg.q;

  // Ensure presence of the file.
  if (!fs.existsSync(src)) {
    console.error(src + ' not exists!');
    return false;
  }

  const buf = await fs.readFileSync(src);
  const mgc = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  
  // Ensure file format.
  if (buf.length < mgc.length) return false;

  for (let i = 0; i < mgc.length; i++) {
    if (buf[i] !== mgc[i]) return false;
  }
  
  // Start to handle the file!!!!
  console.log('Start compressing!');
  const img = UPNG.decode(buf), rgba = UPNG.toRGBA8(img)[0];
  const compressedBuf = new Buffer(UPNG.encode([rgba], img.width, img.height, q));

  // Send the result back.
  console.log('Writing to ' + dst);
  fs.writeFileSync(dst, compressedBuf);

  return true;
}
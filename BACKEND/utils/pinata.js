const axios = require('axios');
const FormData = require('form-data');

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET = process.env.PINATA_SECRET;


/**
 * Upload JSON metadata to IPFS via Pinata
 * @param {Object} metadata - Certificate metadata object
 * @param {string} certId - Certificate ID for naming
 * @returns {Promise<{ipfsHash: string, ipfsUrl: string}>}
 */
async function uploadToIPFS(metadata, certId) {
  const data = JSON.stringify({
    pinataOptions: { cidVersion: 1 },
    pinataMetadata: { name: `VerifyX-Cert-${certId}` },
    pinataContent: metadata,
  });

  const response = await axios.post(
    'https://api.pinata.cloud/pinning/pinJSONToIPFS',
    data,
    {
      headers: {
        'Content-Type': 'application/json',
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET,
      },
    }
  );

  const ipfsHash = response.data.IpfsHash;
  const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

  return { ipfsHash, ipfsUrl };
}

module.exports = { uploadToIPFS };
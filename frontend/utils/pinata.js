// frontend/utils/pinata.js

const JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIzNjFlYWEyMC03NjFiLTRjMWMtYjMxZC0xNTI2ZTBmNzYwOTgiLCJlbWFpbCI6InNyaXZhdHNtNzExQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiJjZmJiZDAyNDA2MjllYjBjMzQ5NiIsInNjb3BlZEtleVNlY3JldCI6Ijg4NzI2NDIzNzMzZjZlN2M0YzU2NWZiNjVmYjZmY2ZhNmZmZGU5ZDY4MjFlYjE3MWFmNThiNjIyOTUwNzAyNzAiLCJleHAiOjE4MDM5NzAwODR9.2molXQiZWhabT172RnQkyHrLXg5f4cZ-0FGt-4qj1N0";

export const uploadFileToIPFS = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const metadata = JSON.stringify({
        name: 'Real Estate Asset',
    });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({
        cidVersion: 0,
    });
    formData.append('pinataOptions', options);

    try {
        const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${JWT}`,
            },
            body: formData,
        });
        const resData = await res.json();
        return `https://gateway.pinata.cloud/ipfs/${resData.IpfsHash}`;
    } catch (error) {
        console.log(error);
        alert("Error uploading file to IPFS");
    }
};
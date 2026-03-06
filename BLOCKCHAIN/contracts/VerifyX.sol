// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract VerifyX {
    struct Certificate {
        string ipfsHash;
        address issuer;
        uint256 issuedAt;
        bool isValid;
        string recipientName;
        string courseName;
        string issuerName;
    }

    mapping(string => Certificate) public certificates;

    event CertificateIssued(string certId, address issuer, string recipientName);
    event CertificateRevoked(string certId, address issuer);

    function issueCertificate(
        string memory certId,
        string memory _recipientName,
        string memory _courseName,
        string memory _issuerName,
        string memory _ipfsHash
    ) public {
        require(bytes(certificates[certId].ipfsHash).length == 0, "Cert ID already exists");

        Certificate storage newCert = certificates[certId];
        newCert.ipfsHash = _ipfsHash;
        newCert.issuer = msg.sender;
        newCert.issuedAt = block.timestamp;
        newCert.isValid = true;
        newCert.recipientName = _recipientName;
        newCert.courseName = _courseName;
        newCert.issuerName = _issuerName;

        emit CertificateIssued(certId, msg.sender, _recipientName);
    }

    function revokeCertificate(string memory certId) public {
        require(certificates[certId].issuer == msg.sender, "Not the issuer");
        require(certificates[certId].isValid, "Already revoked");
        certificates[certId].isValid = false;
        emit CertificateRevoked(certId, msg.sender);
    }

    function verifyCertificate(string memory certId)
        public view returns (Certificate memory)
    {
        return certificates[certId];
    }
}

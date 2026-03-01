// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CertChain {
    struct Certificate {
        string ipfsHash;
        address issuer;
        uint256 issuedAt;
        bool isValid;
        string recipientName;
        string eventName;
        string issuerName;
    }

    mapping(string => Certificate) public certificates;

    event CertificateIssued(string certId, address issuer, string recipientName);
    event CertificateRevoked(string certId, address issuer);

    function issueCertificate(
        string memory certId,
        string memory ipfsHash,
        string memory recipientName,
        string memory eventName,
        string memory issuerName
    ) public {
        require(bytes(certificates[certId].recipientName).length == 0, "Cert ID already exists");
        certificates[certId] = Certificate(
            ipfsHash,
            msg.sender,
            block.timestamp,
            true,
            recipientName,
            eventName,
            issuerName
        );
        emit CertificateIssued(certId, msg.sender, recipientName);
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
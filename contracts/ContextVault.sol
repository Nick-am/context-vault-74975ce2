// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "fhevm/lib/TFHE.sol";
import "fhevm/config/ZamaFHEVMConfig.sol";

contract ContextVault is SepoliaZamaFHEVMConfig {
    struct Entry {
        string ipfsCID;
        euint256 contentHash;
        address creator;
        uint256 createdAt;
        bool active;
        string metadataURI;
    }

    mapping(uint256 => Entry) private entries;
    uint256 public entryCount;

    mapping(address => uint256[]) private creatorEntries;
    mapping(uint256 => mapping(address => bool)) private accessList;

    event EntryCreated(uint256 indexed id, address indexed creator, uint256 timestamp);
    event AccessGranted(uint256 indexed id, address indexed grantee);
    event AccessRevoked(uint256 indexed id, address indexed revokee);
    event VaultAccessed(uint256 indexed id, address indexed accessor, uint256 timestamp);

    modifier onlyCreator(uint256 entryId) {
        require(entries[entryId].creator == msg.sender, "Not the creator");
        _;
    }

    modifier entryExists(uint256 entryId) {
        require(entryId < entryCount, "Entry does not exist");
        _;
    }

    function createEntry(
        einput encryptedContentHash,
        bytes calldata proof,
        string calldata ipfsCID,
        string calldata metadataURI
    ) external returns (uint256 id) {
        require(bytes(ipfsCID).length > 0, "Empty CID");
        require(bytes(metadataURI).length > 0, "Empty metadata URI");

        id = entryCount;
        entryCount++;

        entries[id].ipfsCID = ipfsCID;
        entries[id].contentHash = TFHE.asEuint256(encryptedContentHash, proof);
        entries[id].creator = msg.sender;
        entries[id].createdAt = block.timestamp;
        entries[id].active = true;
        entries[id].metadataURI = metadataURI;

        // Grant FHE ACL access to creator and this contract
        TFHE.allow(entries[id].contentHash, msg.sender);
        TFHE.allow(entries[id].contentHash, address(this));

        creatorEntries[msg.sender].push(id);
        accessList[id][msg.sender] = true;

        emit EntryCreated(id, msg.sender, block.timestamp);
    }

    function grantAccess(uint256 entryId, address addr) external entryExists(entryId) onlyCreator(entryId) {
        require(addr != address(0), "Zero address");
        require(!accessList[entryId][addr], "Already granted");

        accessList[entryId][addr] = true;
        TFHE.allow(entries[entryId].contentHash, addr);

        emit AccessGranted(entryId, addr);
    }

    function revokeAccess(uint256 entryId, address addr) external entryExists(entryId) onlyCreator(entryId) {
        require(addr != msg.sender, "Cannot revoke own access");
        require(accessList[entryId][addr], "Not granted");

        accessList[entryId][addr] = false;

        emit AccessRevoked(entryId, addr);
    }

    function logAccess(uint256 entryId) external entryExists(entryId) {
        require(accessList[entryId][msg.sender], "Not authorized");

        emit VaultAccessed(entryId, msg.sender, block.timestamp);
    }

    function hasAccess(uint256 entryId, address addr) external view entryExists(entryId) returns (bool) {
        return accessList[entryId][addr];
    }

    function getEntry(uint256 entryId) external view entryExists(entryId) returns (
        string memory ipfsCID,
        address creator,
        uint256 createdAt,
        bool active,
        string memory metadataURI
    ) {
        Entry storage e = entries[entryId];
        return (e.ipfsCID, e.creator, e.createdAt, e.active, e.metadataURI);
    }

    function getCreatorEntries(address creator) external view returns (uint256[] memory) {
        return creatorEntries[creator];
    }
}

import { expect } from "chai";
import hre from "hardhat";

/**
 * ContextVault Tests
 *
 * NOTE: Full FHE operations (TFHE.asEuint256, TFHE.allow) require the fhEVM
 * coprocessor and cannot run on vanilla Hardhat. These tests verify compilation,
 * ABI correctness, and document expected behavior. Full integration tests
 * should run against Zama testnet or fhEVM devnet.
 */
describe("ContextVault", function () {
  describe("Compilation & ABI", function () {
    it("should compile and produce a valid contract factory", async function () {
      const factory = await hre.ethers.getContractFactory("ContextVault");
      expect(factory).to.not.be.undefined;
      expect(factory.interface).to.not.be.undefined;
    });

    it("should have createEntry in the ABI", async function () {
      const factory = await hre.ethers.getContractFactory("ContextVault");
      const fragment = factory.interface.getFunction("createEntry");
      expect(fragment).to.not.be.null;
    });

    it("should have grantAccess in the ABI", async function () {
      const factory = await hre.ethers.getContractFactory("ContextVault");
      const fragment = factory.interface.getFunction("grantAccess");
      expect(fragment).to.not.be.null;
    });

    it("should have revokeAccess in the ABI", async function () {
      const factory = await hre.ethers.getContractFactory("ContextVault");
      const fragment = factory.interface.getFunction("revokeAccess");
      expect(fragment).to.not.be.null;
    });

    it("should have logAccess in the ABI", async function () {
      const factory = await hre.ethers.getContractFactory("ContextVault");
      const fragment = factory.interface.getFunction("logAccess");
      expect(fragment).to.not.be.null;
    });

    it("should have hasAccess in the ABI", async function () {
      const factory = await hre.ethers.getContractFactory("ContextVault");
      const fragment = factory.interface.getFunction("hasAccess");
      expect(fragment).to.not.be.null;
    });

    it("should have getEntry in the ABI", async function () {
      const factory = await hre.ethers.getContractFactory("ContextVault");
      const fragment = factory.interface.getFunction("getEntry");
      expect(fragment).to.not.be.null;
    });

    it("should have getCreatorEntries in the ABI", async function () {
      const factory = await hre.ethers.getContractFactory("ContextVault");
      const fragment = factory.interface.getFunction("getCreatorEntries");
      expect(fragment).to.not.be.null;
    });

    it("should have entryCount in the ABI", async function () {
      const factory = await hre.ethers.getContractFactory("ContextVault");
      const fragment = factory.interface.getFunction("entryCount");
      expect(fragment).to.not.be.null;
    });

    it("should emit expected events", async function () {
      const factory = await hre.ethers.getContractFactory("ContextVault");
      expect(factory.interface.getEvent("EntryCreated")).to.not.be.null;
      expect(factory.interface.getEvent("AccessGranted")).to.not.be.null;
      expect(factory.interface.getEvent("AccessRevoked")).to.not.be.null;
      expect(factory.interface.getEvent("VaultAccessed")).to.not.be.null;
    });
  });
});

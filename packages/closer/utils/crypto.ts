import { createHash } from 'crypto';

/**
 * Creates a SHA-256 hash of the input string
 */
export const createHashFromString = (input: string): string => {
  return createHash('sha256').update(input).digest('hex');
};

/**
 * Creates a signature hash for a proposal by hashing the description
 */
export const createProposalSignatureHash = (description: string): string => {
  return createHashFromString(description);
};

/**
 * Creates a signature hash for a vote by hashing the proposal description + vote content
 */
export const createVoteSignatureHash = (proposalDescription: string, vote: 'yes' | 'no' | 'abstain'): string => {
  const voteContent = `${proposalDescription}:${vote}`;
  return createHashFromString(voteContent);
};

/**
 * Verifies a proposal signature by comparing the stored hash with a newly generated hash
 */
export const verifyProposalSignature = (description: string, storedHash: string): boolean => {
  const generatedHash = createProposalSignatureHash(description);
  return generatedHash === storedHash;
};

/**
 * Verifies a vote signature by comparing the stored hash with a newly generated hash
 */
export const verifyVoteSignature = (
  proposalDescription: string, 
  vote: 'yes' | 'no' | 'abstain', 
  storedHash: string
): boolean => {
  const generatedHash = createVoteSignatureHash(proposalDescription, vote);
  return generatedHash === storedHash;
};

/**
 * Verifies an author signature by comparing the stored signature with a newly generated signature
 * Note: This is a placeholder - in a real implementation, this would use cryptographic signature verification
 * with the author's public key to verify that the signature was created by the author's private key
 */
export const verifyAuthorSignature = (
  proposalDescription: string,
  authorSignature: string,
  authorAddress: string
): boolean => {
  // In a real implementation, this would:
  // 1. Hash the proposal description
  // 2. Recover the public key from the signature
  // 3. Compare the recovered address with the authorAddress
  // For now, we'll just verify that the signature exists and is not empty
  return !!authorSignature && authorSignature.length > 0;
};


# 🔐 Test Scenario – Alias-only Keys (Milestone 4)

## 📌 Title:
Handle alias-only keys (cross-account alias mappings)

## 📅 Milestone:
Milestone 4 – Advanced Key Handling

## 📝 Description:
Some banks or partners use AWS KMS aliases that point to keys in other AWS accounts. These aliases do not expose the underlying key metadata unless cross-account permissions are correctly configured.

This test ensures the QuantumFortis system can detect and handle such alias-only cases without errors.

## 🧪 Test Steps:
1. Create an alias (e.g., `alias/partner-key`) that points to a KMS key in a different account or simulate this by restricting access.
2. Trigger a `/scan` using the Lambda function.
3. Review the logs and DynamoDB to see how the system handled the alias.

## ✅ Expected Result:
- The scan completes without crashing.
- Alias-only keys are logged or flagged appropriately.
- If access is denied, it is handled gracefully (no unhandled exceptions).

## 📂 Test Data:
- Alias: `alias/partner-key`
- Linked key: Simulate using an inaccessible or cross-account key

## 🔄 Status:
Planned for Milestone 4

## 👤 Owner:
Sahithi

interface SummaryValidator {
  activeValidators: string | number;
  inactiveValidators: string | number;
  queueValidators: string | number;
  totalValidators: string | number;
}

export const formatTotalValidatorMessage = (data: SummaryValidator) => {
  return `📊 **Summary Report**
━━━━━━━━━━━━━━━━━━━━

📈 **Overall Statistics:**
• Active Validators: ${data.activeValidators}
• Queue Validators: ${data.queueValidators}
• Inactive Validators: ${data.activeValidators}
• Total Validators: ${data.totalValidators}
    `
}
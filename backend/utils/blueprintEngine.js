const Blueprint = require('../models/Blueprint');

/**
 * Validates if a lead can transition from its current stage to a new target stage.
 * Enforces defined transitions and asserts that all configured mandatory fields are populated.
 * @param {Object} lead - The current Mongoose Lead document
 * @param {string} targetStatus - The destination stage name
 * @param {string} tenantId - Tenant ID scoping the transaction
 * @returns {Promise<Object>} Object containing validation outcome ({ isValid: boolean, message?: string })
 */
const validateBlueprintTransition = async (lead, targetStatus, tenantId) => {
  try {
    // If stage is not changing, allow update
    if (!targetStatus || lead.status.toLowerCase() === targetStatus.toLowerCase()) {
      return { isValid: true };
    }

    // Find any active blueprint configured for this tenant
    const blueprint = await Blueprint.findOne({ tenantId, isActive: true });
    if (!blueprint) {
      return { isValid: true }; // No active process builder guidelines, allow all transitions
    }

    // Find if a transition exists between current stage and target stage
    const transition = blueprint.transitions.find(
      t => t.fromStage.toLowerCase() === lead.status.toLowerCase() &&
           t.toStage.toLowerCase() === targetStatus.toLowerCase()
    );

    if (!transition) {
      return {
        isValid: false,
        message: `Forbidden transition: Stage progression from "${lead.status}" to "${targetStatus}" is not defined in the active blueprint.`
      };
    }

    // Assert mandatory fields are populated
    const missingFields = [];
    for (const fieldPath of transition.requiredFields) {
      // Safely resolve nested paths (e.g. 'customFields.budget')
      const value = fieldPath.split('.').reduce((obj, key) => {
        if (obj && obj.get && typeof obj.get === 'function') {
          // Handles mongoose Map lookup (for customFields map schema)
          return obj.get(key);
        }
        return (obj && obj[key] !== undefined) ? obj[key] : undefined;
      }, lead);

      if (value === undefined || value === null || String(value).trim() === '') {
        missingFields.push(fieldPath);
      }
    }

    if (missingFields.length > 0) {
      return {
        isValid: false,
        message: `Blueprint validation failed: To transition from "${lead.status}" to "${targetStatus}", the following fields must be populated: ${missingFields.join(', ')}`
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error('Blueprint validator execution error:', error);
    return { isValid: false, message: 'Server error during blueprint validation.' };
  }
};

module.exports = {
  validateBlueprintTransition
};

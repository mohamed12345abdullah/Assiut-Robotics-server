module.exports=async (password)=>{
    const errors = [];

    // Check for lowercase letter
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push("Password must contain at least one lowercase letter.");
    }
  
    // Check for uppercase letter
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push("Password must contain at least one uppercase letter.");
    }
  
    // Check for a number
    if (!/(?=.*\d)/.test(password)) {
      errors.push("Password must contain at least one number.");
    }
  
    // Check for special character
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push("Password must contain at least one special character, e.g. @$!%*?&.");
    }
  
    // Check password length
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long.");
    }
  
    return errors;

}
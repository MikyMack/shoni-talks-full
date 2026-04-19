function slugify(str) {
    return str
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')   
      .replace(/_+/g, '-')      
      .replace(/[^a-z0-9\-\.]+/g, '') 
      .replace(/\-+/g, '-')      
      .replace(/^\-+|\-+$/g, ''); 
  }
  
  module.exports = slugify;
  
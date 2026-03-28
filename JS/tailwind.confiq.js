/**@type {import('tailwindcss').Config} */
module.exports = {
            darkMode: 'class',
            content: ["../app/dashboard.html"],
            content: ["../app/shop.html"],
            content: ["../app/inventory.html"],
            content: ["../app/finance.html"],
            content: ["../app/damage.html"],
            theme: {
                extend: {
                    colors: {
                        brand: {
                            main: '#132B77',
                            accent: '#0A89A4',
                            cyan: '#16B2C1',
                            success: '#2ecc71',
                            bg: '#b3f9ff',
                            'bg-dark': '#0f172a',
                        }
                    }
                }
            },
        plugins: [],
}
// scans all HTML/JS files in current folder and subfolders
  
    
      
        

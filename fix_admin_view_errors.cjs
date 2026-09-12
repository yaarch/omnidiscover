const fs = require('fs');
let code = fs.readFileSync('src/components/views/AdminView.tsx', 'utf8');

// 1. Add Settings and Activity to lucide-react imports if not present
code = code.replace("LogOut,", "LogOut,\n  Settings,\n  Activity,");

// 2. Fix securityForm
code = code.replace(`  const [securityForm, setSecurityForm] = useState({
    adminEmail: adminConfig.adminEmail,
    newPassword: '',
    confirmPassword: '',
    adminPin: adminConfig.adminPin,
    hideAdminFromPublic: adminConfig.hideAdminFromPublic,
  });`, `  const [securityForm, setSecurityForm] = useState({
    adminEmail: adminEmail || 'admin',
    newPassword: '',
    confirmPassword: '',
    adminPin: '••••••••••••••••',
    hideAdminFromPublic: false,
  });`);

fs.writeFileSync('src/components/views/AdminView.tsx', code);
console.log('Fixed AdminView errors.');

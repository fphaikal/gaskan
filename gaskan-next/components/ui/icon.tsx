import React from 'react';
import * as LucideIcons from 'lucide-react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  icon?: string;
  name?: string;
  size?: number | string;
  className?: string;
}

const MINGCUTE_MAP: Record<string, keyof typeof LucideIcons> = {
  'mingcute:add-circle-fill': 'PlusCircle',
  'mingcute:add-fill': 'Plus',
  'mingcute:add-line': 'Plus',
  'mingcute:arrow-left-line': 'ArrowLeft',
  'mingcute:arrow-right-line': 'ArrowRight',
  'mingcute:arrow-to-up-line': 'ArrowUp',
  'mingcute:book-2-fill': 'BookOpen',
  'mingcute:book-4-fill': 'Book',
  'mingcute:briefcase-fill': 'Briefcase',
  'mingcute:bug-line': 'Bug',
  'mingcute:building-1-fill': 'Building',
  'mingcute:building-2-fill': 'Building2',
  'mingcute:building-4-fill': 'Landmark',
  'mingcute:calendar-2-fill': 'CalendarDays',
  'mingcute:calendar-check-fill': 'CalendarCheck',
  'mingcute:calendar-fill': 'Calendar',
  'mingcute:calendar-line': 'Calendar',
  'mingcute:car-fill': 'Car',
  'mingcute:certificate-fill': 'Award',
  'mingcute:chart-bar-2-fill': 'BarChart3',
  'mingcute:chart-bar-fill': 'BarChart2',
  'mingcute:chart-line-fill': 'TrendingUp',
  'mingcute:chat-1-line': 'MessageSquare',
  'mingcute:chat-3-fill': 'MessageCircle',
  'mingcute:check-2-fill': 'Check',
  'mingcute:check-2-line': 'Check',
  'mingcute:check-circle-fill': 'CheckCircle2',
  'mingcute:check-circle-line': 'CheckCircle',
  'mingcute:check-fill': 'Check',
  'mingcute:chip-fill': 'Cpu',
  'mingcute:chip-line': 'Cpu',
  'mingcute:classify-2-fill': 'Grid',
  'mingcute:clipboard-fill': 'Clipboard',
  'mingcute:close-circle-fill': 'XCircle',
  'mingcute:close-circle-line': 'XCircle',
  'mingcute:close-fill': 'X',
  'mingcute:close-line': 'X',
  'mingcute:cloud-upload-line': 'CloudUpload',
  'mingcute:code-fill': 'Code2',
  'mingcute:computer-fill': 'Monitor',
  'mingcute:copy-2-line': 'Copy',
  'mingcute:cpu-line': 'Cpu',
  'mingcute:cursor-hand-line': 'MousePointer',
  'mingcute:dashboard-3-fill': 'LayoutDashboard',
  'mingcute:delete-2-fill': 'Trash2',
  'mingcute:delete-2-line': 'Trash2',
  'mingcute:device-fill': 'Smartphone',
  'mingcute:document-2-fill': 'FileText',
  'mingcute:document-fill': 'FileText',
  'mingcute:document-line': 'FileText',
  'mingcute:down-line': 'ChevronDown',
  'mingcute:download-2-line': 'Download',
  'mingcute:download-3-fill': 'Download',
  'mingcute:edit-2-fill': 'Edit2',
  'mingcute:edit-2-line': 'Edit2',
  'mingcute:edit-3-fill': 'Edit3',
  'mingcute:edit-4-line': 'Edit3',
  'mingcute:enter-door-fill': 'LogIn',
  'mingcute:exit-fill': 'LogOut',
  'mingcute:exit-line': 'LogOut',
  'mingcute:external-link-line': 'ExternalLink',
  'mingcute:eye-2-fill': 'Eye',
  'mingcute:eye-2-line': 'Eye',
  'mingcute:eye-close-line': 'EyeOff',
  'mingcute:eye-line': 'Eye',
  'mingcute:face-fill': 'Smile',
  'mingcute:face-line': 'Smile',
  'mingcute:faceid-fill': 'ScanFace',
  'mingcute:faceid-line': 'ScanFace',
  'mingcute:factory-fill': 'Factory',
  'mingcute:file-check-fill': 'FileCheck',
  'mingcute:file-download-line': 'FileDown',
  'mingcute:file-export-fill': 'FileOutput',
  'mingcute:file-export-line': 'FileUp',
  'mingcute:file-import-fill': 'FileInput',
  'mingcute:file-import-line': 'FileDown',
  'mingcute:file-line': 'File',
  'mingcute:file-new-fill': 'FilePlus',
  'mingcute:file-text-fill': 'FileText',
  'mingcute:filter-2-line': 'Filter',
  'mingcute:filter-fill': 'Filter',
  'mingcute:fingerprint-fill': 'Fingerprint',
  'mingcute:fingerprint-line': 'Fingerprint',
  'mingcute:flask-fill': 'FlaskConical',
  'mingcute:folder-open-fill': 'FolderOpen',
  'mingcute:folder-open-line': 'FolderOpen',
  'mingcute:group-3-fill': 'Users',
  'mingcute:group-fill': 'Users',
  'mingcute:group-line': 'Users',
  'mingcute:hard-drive-line': 'HardDrive',
  'mingcute:heart-fill': 'Heart',
  'mingcute:heart-line': 'Heart',
  'mingcute:history-line': 'History',
  'mingcute:idcard-fill': 'IdCard',
  'mingcute:information-line': 'Info',
  'mingcute:key-2-fill': 'KeyRound',
  'mingcute:key-2-line': 'KeyRound',
  'mingcute:laptop-fill': 'Laptop',
  'mingcute:left-line': 'ChevronLeft',
  'mingcute:lightning-fill': 'Zap',
  'mingcute:link-2-line': 'Link',
  'mingcute:list-check-2-fill': 'ListChecks',
  'mingcute:loading-3-line': 'Loader2',
  'mingcute:loading-fill': 'Loader2',
  'mingcute:location-2-fill': 'MapPin',
  'mingcute:location-fill': 'MapPin',
  'mingcute:lock-fill': 'Lock',
  'mingcute:lock-line': 'Lock',
  'mingcute:login-box-line': 'LogIn',
  'mingcute:logout-box-line': 'LogOut',
  'mingcute:mail-fill': 'Mail',
  'mingcute:mail-line': 'Mail',
  'mingcute:mail-send-line': 'Send',
  'mingcute:microscope-fill': 'Microscope',
  'mingcute:moon-line': 'Moon',
  'mingcute:package-line': 'Package',
  'mingcute:palette-fill': 'Palette',
  'mingcute:pdf-line': 'FileText',
  'mingcute:pencil-fill': 'Pencil',
  'mingcute:phone-fill': 'Phone',
  'mingcute:pic-line': 'Image',
  'mingcute:pin-fill': 'Pin',
  'mingcute:plus-fill': 'Plus',
  'mingcute:qrcode-2-line': 'QrCode',
  'mingcute:quote-left-fill': 'Quote',
  'mingcute:radar-fill': 'Radar',
  'mingcute:radar-line': 'Radar',
  'mingcute:refresh-1-line': 'RefreshCw',
  'mingcute:refresh-3-line': 'RotateCw',
  'mingcute:right-line': 'ChevronRight',
  'mingcute:safe-shield-line': 'ShieldCheck',
  'mingcute:save-fill': 'Save',
  'mingcute:school-fill': 'GraduationCap',
  'mingcute:school-line': 'GraduationCap',
  'mingcute:search-line': 'Search',
  'mingcute:server-2-fill': 'Server',
  'mingcute:server-fill': 'Server',
  'mingcute:server-line': 'Server',
  'mingcute:settings-1-fill': 'Settings',
  'mingcute:settings-3-fill': 'Sliders',
  'mingcute:settings-6-fill': 'Settings2',
  'mingcute:settings-6-line': 'Settings2',
  'mingcute:shield-check-line': 'ShieldCheck',
  'mingcute:shield-fill': 'Shield',
  'mingcute:shield-shape-fill': 'ShieldAlert',
  'mingcute:signal-fill': 'Radio',
  'mingcute:sun-line': 'Sun',
  'mingcute:time-fill': 'Clock',
  'mingcute:time-line': 'Clock',
  'mingcute:tool-fill': 'Wrench',
  'mingcute:transfer-4-line': 'ArrowLeftRight',
  'mingcute:upload-2-fill': 'Upload',
  'mingcute:upload-3-fill': 'Upload',
  'mingcute:user-3-fill': 'User',
  'mingcute:user-3-line': 'User',
  'mingcute:user-4-fill': 'UserCheck',
  'mingcute:user-4-line': 'User',
  'mingcute:user-add-fill': 'UserPlus',
  'mingcute:user-check-fill': 'UserCheck',
  'mingcute:user-close-line': 'UserX',
  'mingcute:user-info-fill': 'UserCheck',
  'mingcute:user-search-fill': 'UserSearch',
  'mingcute:user-setting-fill': 'UserCog',
  'mingcute:video-camera-fill': 'Video',
  'mingcute:warning-fill': 'AlertTriangle',
  'mingcute:wifi-line': 'Wifi',
  'mingcute:zoom-in-line': 'ZoomIn',
};

export const Icon: React.FC<IconProps> = ({
  icon,
  name,
  size = 20,
  className = '',
  style,
  ...props
}) => {
  const iconKey = icon || name || '';

  // Custom social icons or direct fallback
  if (iconKey === 'mingcute:github-line') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
        {...props}
      >
        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
        <path d="M9 18c-4.51 2-5-2-7-2" />
      </svg>
    );
  }

  if (iconKey === 'mingcute:ins-line') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
        {...props}
      >
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    );
  }

  if (iconKey === 'mingcute:linkedin-line') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
        {...props}
      >
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect width="4" height="12" x="2" y="9" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    );
  }

  let LucideComp: React.ComponentType<LucideIcons.LucideProps> | undefined;

  if (iconKey in MINGCUTE_MAP) {
    const compName = MINGCUTE_MAP[iconKey];
    LucideComp = LucideIcons[compName] as React.ComponentType<LucideIcons.LucideProps>;
  } else if (iconKey in LucideIcons) {
    LucideComp = LucideIcons[iconKey as keyof typeof LucideIcons] as React.ComponentType<LucideIcons.LucideProps>;
  } else {
    // Basic fuzzy check / strip prefix if any
    const cleanKey = iconKey.replace('mingcute:', '').replace(/-(line|fill)$/, '');
    const pascalKey = cleanKey
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
    if (pascalKey in LucideIcons) {
      LucideComp = LucideIcons[pascalKey as keyof typeof LucideIcons] as React.ComponentType<LucideIcons.LucideProps>;
    }
  }

  if (!LucideComp) {
    LucideComp = LucideIcons.HelpCircle;
  }

  const numericSize = typeof size === 'number' ? size : parseInt(size, 10) || 20;

  return <LucideComp size={numericSize} className={className} style={style} {...(props as any)} />;
};

export default Icon;

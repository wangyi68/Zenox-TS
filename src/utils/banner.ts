import { Colors } from './logger';

export function displayBanner(): void {
  const banner = `
${Colors.CYAN}╔══════════════════════════════════════════════════════════════╗${Colors.RESET}
${Colors.CYAN}║${Colors.RESET}                                                          ${Colors.CYAN}║${Colors.RESET}
${Colors.CYAN}║${Colors.RESET}  ${Colors.BRIGHT}${Colors.MAGENTA}███████╗███████╗███╗   ██╗ ██████╗ ██╗  ██╗${Colors.RESET}              ${Colors.CYAN}║${Colors.RESET}
${Colors.CYAN}║${Colors.RESET}  ${Colors.BRIGHT}${Colors.MAGENTA}╚══███╔╝██╔════╝████╗  ██║██╔═══██╗╚██╗██╔╝${Colors.RESET}              ${Colors.CYAN}║${Colors.RESET}
${Colors.CYAN}║${Colors.RESET}    ${Colors.BRIGHT}${Colors.MAGENTA}███╔╝ █████╗  ██╔██╗ ██║██║   ██║ ╚███╔╝ ${Colors.RESET}              ${Colors.CYAN}║${Colors.RESET}
${Colors.CYAN}║${Colors.RESET}   ${Colors.BRIGHT}${Colors.MAGENTA}███╔╝  ██╔══╝  ██║╚██╗██║██║   ██║ ██╔██╗ ${Colors.RESET}              ${Colors.CYAN}║${Colors.RESET}
${Colors.CYAN}║${Colors.RESET}  ${Colors.BRIGHT}${Colors.MAGENTA}███████╗███████╗██║ ╚████║╚██████╔╝██╔╝ ██╗${Colors.RESET}              ${Colors.CYAN}║${Colors.RESET}
${Colors.CYAN}║${Colors.RESET}  ${Colors.BRIGHT}${Colors.MAGENTA}╚══════╝╚══════╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝  ╚═╝${Colors.RESET}              ${Colors.CYAN}║${Colors.RESET}
${Colors.CYAN}║${Colors.RESET}                                                          ${Colors.CYAN}║${Colors.RESET}
${Colors.CYAN}║${Colors.RESET}  ${Colors.BRIGHT}${Colors.YELLOW}Discord Bot for Hoyoverse Games${Colors.RESET}                    ${Colors.CYAN}║${Colors.RESET}
${Colors.CYAN}║${Colors.RESET}  ${Colors.DIM}Genshin Impact • Honkai: Star Rail • Zenless Zone Zero${Colors.RESET}  ${Colors.CYAN}║${Colors.RESET}
${Colors.CYAN}║${Colors.RESET}                                                          ${Colors.CYAN}║${Colors.RESET}
${Colors.CYAN}╚══════════════════════════════════════════════════════════════╝${Colors.RESET}
`;

  console.log(banner);
}

export function displaySystemInfo(): void {
  const systemInfo = {
    'Node.js Version': process.version,
    'Platform': `${process.platform} ${process.arch}`,
    'Memory Usage': `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
    'Process ID': process.pid,
    'Working Directory': process.cwd(),
    'Environment': process.env.NODE_ENV || 'development'
  };

  console.log(`${Colors.CYAN}${Colors.BRIGHT}System Information:${Colors.RESET}`);
  Object.entries(systemInfo).forEach(([key, value]) => {
    console.log(`  ${Colors.DIM}${key}:${Colors.RESET} ${Colors.WHITE}${value}${Colors.RESET}`);
  });
  console.log('');
}

export function displayVersionInfo(version: string): void {
  console.log(`${Colors.GREEN}${Colors.BRIGHT}Version:${Colors.RESET} ${Colors.WHITE}${version}${Colors.RESET}`);
  console.log(`${Colors.GREEN}${Colors.BRIGHT}Build Date:${Colors.RESET} ${Colors.WHITE}${new Date().toISOString()}${Colors.RESET}`);
  console.log('');
}

export function displayStartupMessage(env: string): void {
  const envColor = env === 'production' ? Colors.RED : env === 'staging' ? Colors.YELLOW : Colors.GREEN;
  console.log(`${envColor}${Colors.BRIGHT}Starting Zenox Bot in ${env.toUpperCase()} mode...${Colors.RESET}`);
  console.log('');
}
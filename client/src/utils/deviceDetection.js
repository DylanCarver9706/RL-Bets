export const getDeviceInfo = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);
  const isMobileBrowser = /mobile|android|iphone|ipad|ipod/.test(userAgent);
  const isDesktop = !isMobileBrowser;

  return {
    isIOS,
    isAndroid,
    isDesktop,
    isMobileBrowser,
  };
};

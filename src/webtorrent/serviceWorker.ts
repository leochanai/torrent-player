import type { AppError, CapabilityState } from './types'

export function detectCapabilities(): CapabilityState {
  const webRtcSupported = typeof RTCPeerConnection !== 'undefined'
  const serviceWorkerSupported =
    typeof navigator !== 'undefined' && 'serviceWorker' in navigator

  return {
    webRtcSupported,
    serviceWorkerSupported,
    streamServerReady: false,
    codecHint: buildCapabilityHint(webRtcSupported, serviceWorkerSupported),
  }
}

export async function registerStreamServiceWorker(
  workerUrl = '/sw.min.js',
): Promise<ServiceWorkerRegistration> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    throw createServiceWorkerError('当前浏览器不支持 Service Worker。')
  }

  try {
    const registration = await navigator.serviceWorker.register(workerUrl, { scope: '/' })
    await navigator.serviceWorker.ready

    if (registration.active?.state === 'activated') {
      return registration
    }

    const worker = registration.active ?? registration.waiting ?? registration.installing
    if (!worker) {
      throw new Error('Service Worker registration has no worker.')
    }

    await waitForActivation(worker)
    return registration
  } catch (error) {
    throw createServiceWorkerError('WebTorrent stream server 初始化失败。', error)
  }
}

function waitForActivation(worker: ServiceWorker): Promise<void> {
  if (worker.state === 'activated') return Promise.resolve()

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      worker.removeEventListener('statechange', onStateChange)
      reject(new Error('Timed out waiting for Service Worker activation.'))
    }, 8000)

    function onStateChange(): void {
      if (worker.state === 'activated') {
        window.clearTimeout(timeout)
        worker.removeEventListener('statechange', onStateChange)
        resolve()
      }
    }

    worker.addEventListener('statechange', onStateChange)
  })
}

function buildCapabilityHint(webRtcSupported: boolean, serviceWorkerSupported: boolean): string {
  if (!webRtcSupported) return '当前浏览器没有 WebRTC，无法连接 WebTorrent peers。'
  if (!serviceWorkerSupported) return '当前浏览器没有 Service Worker，无法创建流式播放地址。'
  return 'WebRTC 与 Service Worker 可用。'
}

function createServiceWorkerError(message: string, error?: unknown): AppError {
  return {
    code: 'service-worker-failed',
    message,
    technicalDetail: error instanceof Error ? error.message : undefined,
    recoveryAction: '刷新页面后重试，或确认当前页面通过 http://localhost / https 打开。',
  }
}

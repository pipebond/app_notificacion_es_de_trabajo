{
  {
    flutter_js;
  }
}
{
  {
    flutter_build_config;
  }
}

const loadFlutterApp = () => {
  _flutter.loader.load({
    serviceWorkerSettings: {
      serviceWorkerVersion: null,
    },
  });
};

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) =>
      Promise.all(
        registrations.map((registration) => registration.unregister()),
      ),
    )
    .catch(() => undefined)
    .finally(loadFlutterApp);
} else {
  loadFlutterApp();
}

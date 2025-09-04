# heisenware-ext-process-simulations

## Building the image

```bash
docker build -t heisenware/process-simulations .
```

## Pushing the image

Pushing requires a docker login for the heisenware organization.

```bash
docker login -u bheisen
```

```bash
docker push heisenware/process-simulations
```

Done.

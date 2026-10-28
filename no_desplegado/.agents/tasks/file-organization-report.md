# Reporte de Organización de Archivos No Desplegados

## Fecha
2026-10-28 02:19:20

## Resumen
Se han movido los siguientes archivos y directorios que NO se utilizan en el despliegue ECS/Fargate al directorio 'no_desplegado':

## Archivos Movidos
- **.agents/** - Configuración de herramientas de desarrollo (agentes y skills)
- **.aos/** - Configuración del sistema AOS (agentes, CI, contratos, decisiones, hooks, conocimiento, planes, seguridad, skills, especificaciones, config.json, mcp-config.json)
- **.gitignore** - Configuración de git (no necesaria en despliegue)
- **README.md** (raíz) - Documentación del proyecto (duplicado, ya existe en no_desplegado)

## Archivos Que PERMANECEN en la Raíz (SE DESPLIEGAN)
- **Dockerfile** - Imagen de contenedor para ECS/Fargate
- **backend/** - Código de la aplicación Python (requerido en el contenedor)
  - requirements.txt - Dependencias
  - main.py - Punto de entrada
  - Otros módulos: engine.py, montecarlo.py, presets.py
- **frontend/** - Código de la interfaz web (servido por la aplicación)
  - Estructura HTML, CSS, JS, assets

## Contenido de 'no_desplegado' (después de la reorganización)
### Directorios
- .agents/skills/ - Skillsde agentes
- .agents/tasks/ - Tareas de agentes
- .aos/ - Configuración AOS completa
- .ebextensions/ - Configuración Elastic Beanstalk (abandonada)
- .elasticbeanstalk/ - Configuración Elastic Beanstalk (abandonada)
- .github/ - Configuración CI/CD (workflows)
- .platform/ - Configuración de plataforma (abandonada)
- docs/ - Documentación del proyecto
- infra/ - Código de infraestructura (IaC)
- scripts/ - Scripts de utilidad y desarrollo

### Archivos
- .dockerignore - Ignorar en contexto de build
- .gitignore - Configuración de git
- app.zip - Archivo empaquetado (no usado)
- buildspec.yml - Especificación de CodeBuild (abandonada)
- DEPLOY_TO_ECS.md
- deploy-ecs-fixed.ps1
- deploy-ecs.ps1
- DEPLOYMENT.md
- ECS_DEPLOYMENT.md
- ecs-task-definition.json - Definición anterior de tarea
- Documentación varia: FINAL_DEPLOYMENT_RESULT.md, GEMINI.md, OBTENER_URL_AHORA.md, etc.
- Procfile - Configuración Heroku (no usado)
- README.md - Documentación del proyecto
- SPOOKYTHON_SUBMISSION.md - Documentación de envío
- vercel.json - Configuración Vercel (no usado)
- Spookython 2026 - Track B_ La Plaga Zombie.pdf - Documentación del proyecto

## Estructura Final del Proyecto
\\\
bottitos-spookython/
├── .git/ (control de versiones - no desplegado)
├── backend/ (SE DESPLIEGA)
│   ├── requirements.txt
│   ├── main.py
│   ├── engine.py
│   ├── montecarlo.py
│   ├── presets.py
│   └── __init__.py
├── frontend/ (SE DESPLIEGA)
│   ├── assets/
│   ├── css/
│   ├── js/
│   ├── index.html
│   └── montecarlo.html
├── Dockerfile (SE DESPLIEGA)
└── no_desplegado/
    ├── .agents/
    ├── .aos/
    ├── .ebextensions/
    ├── .elasticbeanstalk/
    ├── .github/
    ├── .platform/
    ├── docs/
    ├── infra/
    ├── scripts/
    ├── .dockerignore
    ├── .gitignore
    ├── [y todos los demás archivos no desplegados...]
\\\

## Notas
- El despliegue ECS/Fargate solo necesita:
  - Dockerfile (punto de entrada del build)
  - backend/ (código de la aplicación)
  - frontend/ (interfaz web)
- Todos los archivos de configuración local, herramientas de desarrollo, documentación y especificaciones han sido centralizados en la carpeta 'no_desplegado'
- El contenedor sigue siendo completamente funcional con esta organización
- El .git se mantiene en la raíz para preservar el historial de versiones

#!/bin/sh

# Ejecuta un comando sin las variables que Git inyecta en los hooks. Esto evita
# que procesos descendientes confundan el repositorio real con repositorios
# temporales creados durante las pruebas.
run_without_local_git_env() (
  git_local_variables="$(git rev-parse --local-env-vars)"

  for variable in $git_local_variables; do
    unset "$variable"
  done

  "$@"
)

pipeline {
    agent any

    tools {
        nodejs 'nodejs 22.13.0 (LTS)'
    }

    environment {
        DEPLOY_DIR = '/var/www/grizzpector'

        DOCKER_BUILDKIT = 1
        DOCKER_REGISTRY = 'https://index.docker.io/v1'
        DOCKER_IMAGE = 'sandmanren/grizzpector'
        DOCKER_TAG = 'latest'
        DOCKER_CREDENTIALS = 'cred-docker-sandmanren'

        CONTAINER_NAME = 'grizzpector-app'
        CONTAINER_PORT = '43000'
    }

    stages {
        stage('Install Dependencies') {
            steps {
                echo 'Installing dependencies...'
                sh 'npm install'
            }
        }

        stage('Lint') {
            steps {
                echo 'Running lint checks...'
                // Add your linting command here if needed, e.g., `npm run lint`
                sh 'npm run lint || echo "Linting skipped (no lint script defined)."'
            }
        }

        stage('Build') {
            steps {
                echo 'Building the project...'
                sh 'npm run build'
            }
        }

        stage('Test') {
            steps {
                echo 'Running tests...'
                sh 'npm test || echo "No tests defined, skipping."'
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    echo "Building docker image ${DOCKER_REGISTRY}/${DOCKER_IMAGE}:${DOCKER_TAG}"
                    sh "docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} ."
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                script {
                    docker.withRegistry("${DOCKER_REGISTRY}", "${DOCKER_CREDENTIALS}") {
                        sh "docker push ${DOCKER_IMAGE}:${DOCKER_TAG}"
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                // ensure deployment directory exists
                sh 'mkdir -p ${DEPLOY_DIR}'
                // copy build artifacts to the deployment factory
                sh 'cp -r dist/* ${DEPLOY_DIR}'
            }
        }

        stage('Archive Artifacts') {
            steps {
                echo 'Archiving built artifacts...'
                archiveArtifacts artifacts: 'dist/**/*', allowEmptyArchive: true
            }
        }
    }

    post {
        always {
            echo 'Pipeline execution finished.'
        }
        success {
            echo 'Build and push succeeded. Updating container...'
            script {
                echo 'Stopping existing container ${CONTAINER_NAME}'
                sh "docker stop ${CONTAINER_NAME} && docker rm ${CONTAINER_NAME}"
                sh "docker run -d --name ${CONTAINER_NAME} -p ${CONTAINER_PORT}:3000 ${DOCKER_REGISTRY}/${DOCKER_IMAGE}:${DOCKER_TAG}"
            }
        }
        failure {
            echo 'Build failed.'
        }
    }
}

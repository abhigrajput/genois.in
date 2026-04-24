-- ── PROJECTS SEED — one project per week per domain ──────────────────────────
-- Run this in Supabase SQL Editor after seed.sql

INSERT INTO projects (domain_slug, week_number, title, description, difficulty, steps, tech_stack) VALUES

-- FULLSTACK
('fullstack', 1, 'Personal Portfolio Website', 'Build a responsive personal portfolio using HTML, CSS, and JavaScript. Include sections for about, skills, projects, and contact form.',
 'beginner',
 ARRAY['Set up HTML structure with semantic tags', 'Style with CSS Grid and Flexbox', 'Add JavaScript for interactivity and form validation', 'Deploy on GitHub Pages or Vercel'],
 ARRAY['HTML5', 'CSS3', 'JavaScript', 'Git']),

('fullstack', 2, 'Todo App with Local Storage', 'Build a full CRUD todo application with persistent storage, filters (all/active/completed), and a clean UI.',
 'beginner',
 ARRAY['Create UI with HTML/CSS', 'Implement add/delete/toggle logic in JS', 'Add localStorage persistence', 'Add filter and sort functionality'],
 ARRAY['HTML', 'CSS', 'JavaScript', 'LocalStorage']),

('fullstack', 3, 'Weather Dashboard', 'Build a weather app using the OpenWeatherMap API. Display current weather and 5-day forecast with search.',
 'intermediate',
 ARRAY['Set up API key and fetch current weather', 'Display weather data with icons and colors', 'Add 5-day forecast section', 'Add city search with error handling'],
 ARRAY['JavaScript', 'Fetch API', 'OpenWeatherMap API', 'CSS']),

('fullstack', 4, 'Blog with Next.js', 'Build a blog app with Next.js — list posts, individual post pages, and a simple in-memory or JSON data source.',
 'intermediate',
 ARRAY['Set up Next.js project and file-based routing', 'Create posts list page with cards', 'Build individual post page with dynamic routing', 'Add responsive CSS styling and navigation'],
 ARRAY['Next.js', 'React', 'CSS Modules', 'JavaScript']),

-- DSA
('dsa', 1, 'Array Problems Visualizer', 'Build a web tool that visually demonstrates common array algorithms like bubble sort and binary search step by step.',
 'beginner',
 ARRAY['Set up the UI with input and display area', 'Implement bubble sort with step visualization', 'Add binary search visualization', 'Add controls for speed and array size'],
 ARRAY['JavaScript', 'HTML', 'CSS', 'Canvas/DOM']),

('dsa', 2, 'Stack and Queue Simulator', 'Build an interactive simulator that lets users push/pop on a stack and enqueue/dequeue on a queue with animations.',
 'beginner',
 ARRAY['Build stack UI with push/pop buttons', 'Animate stack operations', 'Add queue with enqueue/dequeue', 'Show state after each operation'],
 ARRAY['JavaScript', 'HTML', 'CSS']),

('dsa', 3, 'Linked List Visualizer', 'Interactive tool to insert, delete, and search nodes in a singly linked list with visual node connections.',
 'intermediate',
 ARRAY['Implement linked list class in JS', 'Build SVG or DOM visualization of nodes', 'Add insert at head/tail/position', 'Add delete and search with highlight'],
 ARRAY['JavaScript', 'SVG', 'HTML', 'CSS']),

('dsa', 4, 'Graph BFS/DFS Explorer', 'Build a graph explorer where users can add nodes/edges and run BFS or DFS with step-by-step animation.',
 'intermediate',
 ARRAY['Build graph data structure and adjacency list', 'Implement BFS with queue and highlight visited', 'Implement DFS with stack/recursion and highlight', 'Add UI to add nodes and edges interactively'],
 ARRAY['JavaScript', 'Canvas', 'HTML', 'CSS']),

-- PYTHON
('python', 1, 'Number Guessing Game', 'CLI game where computer picks a number 1-100 and player guesses with hints (too high/too low). Track score and attempts.',
 'beginner',
 ARRAY['Set up game loop and random number generation', 'Add user input with validation', 'Track attempts and show hint each round', 'Add score tracking and play-again option'],
 ARRAY['Python', 'random module']),

('python', 2, 'Student Grade Manager', 'CLI app to add students, enter grades for multiple subjects, calculate averages, and generate a report.',
 'beginner',
 ARRAY['Create student data structure with dict', 'Add/update/delete students and grades', 'Calculate average and letter grade', 'Generate formatted report and save to file'],
 ARRAY['Python', 'os module', 'json']),

('python', 3, 'Web Scraper', 'Scrape news headlines from a public website and save them to a CSV file with title, link, and timestamp.',
 'intermediate',
 ARRAY['Set up requests and BeautifulSoup', 'Scrape headlines and links from news page', 'Parse and clean data', 'Save to CSV with pandas or csv module'],
 ARRAY['Python', 'requests', 'BeautifulSoup', 'csv']),

('python', 4, 'Flask REST API', 'Build a simple REST API with Flask — endpoints for CRUD operations on a tasks resource with JSON responses.',
 'intermediate',
 ARRAY['Set up Flask app and structure', 'Implement GET all and GET by id', 'Implement POST and DELETE', 'Add basic error handling and test with Postman'],
 ARRAY['Python', 'Flask', 'JSON', 'REST']),

-- AIML
('aiml', 1, 'Data Analysis with Pandas', 'Load a real dataset (Titanic or Iris), perform EDA — describe, groupby, missing values, and visualize distributions.',
 'beginner',
 ARRAY['Load dataset with pandas', 'Explore shape, dtypes, describe, head', 'Handle missing values and duplicates', 'Plot histograms and correlation heatmap'],
 ARRAY['Python', 'pandas', 'matplotlib', 'seaborn']),

('aiml', 2, 'Linear Regression Model', 'Build a linear regression model to predict house prices using scikit-learn. Include train/test split and metrics.',
 'beginner',
 ARRAY['Load and preprocess housing dataset', 'Split into train and test sets', 'Train LinearRegression model', 'Evaluate with MSE and R2, plot predictions'],
 ARRAY['Python', 'scikit-learn', 'pandas', 'matplotlib']),

('aiml', 3, 'Image Classifier', 'Build a CNN to classify MNIST handwritten digits. Train for 5 epochs and achieve >95% accuracy.',
 'intermediate',
 ARRAY['Load MNIST and preprocess (normalize, reshape)', 'Build CNN with Conv2D and MaxPooling layers', 'Compile with Adam and categorical_crossentropy', 'Train and evaluate, plot accuracy curve'],
 ARRAY['Python', 'TensorFlow/Keras', 'numpy', 'matplotlib']),

('aiml', 4, 'Sentiment Analyzer', 'Build a sentiment analysis model for movie reviews using TF-IDF and Logistic Regression. Classify as positive or negative.',
 'intermediate',
 ARRAY['Load IMDB dataset or sample reviews', 'Preprocess text (clean, tokenize, vectorize)', 'Train Logistic Regression with TF-IDF features', 'Evaluate accuracy and test with custom input'],
 ARRAY['Python', 'scikit-learn', 'NLTK', 'pandas']),

-- DEVOPS
('devops', 1, 'Linux Shell Scripts Collection', 'Write 5 useful bash scripts — system info, backup files, log cleaner, user manager, and disk usage monitor.',
 'beginner',
 ARRAY['Write system-info.sh to display CPU/RAM/disk', 'Write backup.sh to zip and timestamp a folder', 'Write log-cleaner.sh to delete logs older than N days', 'Write disk-alert.sh to notify when disk > 80% full'],
 ARRAY['Bash', 'Linux', 'Cron']),

('devops', 2, 'Docker Containerized App', 'Dockerize a simple Node.js Express app — write Dockerfile, build image, run container, and use docker-compose.',
 'beginner',
 ARRAY['Write simple Express app with /health endpoint', 'Write Dockerfile with multi-stage build', 'Build and run container, verify endpoint', 'Add docker-compose.yml and test with compose up'],
 ARRAY['Docker', 'Node.js', 'docker-compose']),

('devops', 3, 'CI/CD Pipeline with GitHub Actions', 'Set up a GitHub Actions workflow that runs tests, builds a Docker image, and deploys on push to main.',
 'intermediate',
 ARRAY['Create a test and lint step in workflow', 'Add Docker build and push to GHCR step', 'Add deploy step (SSH or render/fly.io)', 'Test pipeline by pushing a commit'],
 ARRAY['GitHub Actions', 'Docker', 'YAML', 'CI/CD']),

('devops', 4, 'Kubernetes Deployment', 'Deploy a containerized app to Kubernetes (Minikube). Write Deployment, Service, and ConfigMap manifests.',
 'intermediate',
 ARRAY['Set up Minikube and kubectl', 'Write Deployment manifest for the app', 'Write Service manifest (NodePort or LoadBalancer)', 'Write ConfigMap for environment variables'],
 ARRAY['Kubernetes', 'Minikube', 'kubectl', 'YAML']);

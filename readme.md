# ForumIpsum

ForumIpsum is a web forum application designed and developed as part of the Big Data and Machine Learning elective course by a group of 4 students studying Angewante Informatik at HAW Hamburg. The forum is unique in its use of OpenAI's GPT model for offensive speech detection and intentional misinformation detection, providing a safer and more reliable online community experience.

## Features

The application handles several essential features of a web forum, including:

- User authentication
- Post creation and deletion
- Post labelling
- Comments
- Database management (utilizing MongoDB)

Please note, as of this writing, the forum is still under development, and some features may be lacking.

## Tech Stack

- Backend: Python Flask
- Frontend: JavaScript, HTML/CSS
- Database: MongoDB
- AI Moderation: OpenAI's GPT

## Getting Started

The project is containerized using Docker, which handles the necessary dependencies. 

### Prerequisites

Ensure you have Docker installed on your system.

### Installation

1. Clone the repository:
```
git clone https://github.com/MarkCarsonDev/forumipsum.git
```

2. Navigate to the project directory:
```
cd forumipsum
```

3. Build and run the Docker container:
```
docker build -t forumipsum .
docker compose up --build
```

The forum should now be accessible at `localhost:5000`.

## Contributing

This project was developed for a course and because of this, contributing isn't an option.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) (coming soon) file for details.

## Acknowledgements

We would like to express our gratitude to the instructors Dr. Zukunf and Herr Anderson of the Big Data and Machine Learning elective course at HAW Hamburg for their guidance and support.

## Contact

For any inquiries, please open an issue in this GitHub repository.

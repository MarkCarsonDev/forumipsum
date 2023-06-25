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
- AI Moderation: OpenAI's GPT-3.5 and GPT-4 model, a DNN trained on false news

## Getting Started

The project is containerized using Docker, which handles the necessary dependencies. 

### Prerequisites

Ensure you have Docker installed on your system and an OpenAI key with GPT-3.5 and GPT-4 access and credit.

### Setting Up OpenAI Key

For the AI moderation feature, you need to provide your OpenAI key. This can be set in an environment variable.

1. Create a file named `.env` in the root directory of the project.
2. Inside this file, add the following line, replacing your-key with your OpenAI key:
```
OPENAI_API_KEY=yourkey
```

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

The forum should now be accessible at `localhost:5001`.

## Contributing

This project was developed for a university course, and contributions are currently closed. We appreciate your interest and encourage you to explore and learn from the code. For any inquiries, please open an issue in this GitHub repository.


## License

This project is licensed under the MIT License.

MIT License

Copyright (c) 2023 Mark Carson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Acknowledgements

We would like to express our gratitude to the instructors Dr. Zukunf and Jacob Anderson of the Big Data and Machine Learning elective course at HAW Hamburg for their guidance and support.

## Contact

For any inquiries, please open an issue in this GitHub repository.

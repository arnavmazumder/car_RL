# Autonomous Driving Agent Training Interface

This web application is designed to perform training experiments on a self-driving agent in a track environment. Through this interface, users can select training hyperparameters, run training experiments, view live metrics, save and run trained models, generate random tracks, display collision and rewards sensors, and control respawning behavior. 

![hippo]()


## Technologies Used

- **Frontends**: React, Javascript, HTML, Python
- **Backend**: Python, Flask, Pytorch, Numpy, Matplotlib, Joblib, Requests
- **Development Tools**: VSCode, GitHub

## Getting Started
This repository contains all of the code necessary for running the application locally.

### Prereqs
- Git
- Python: &nbsp;&nbsp;<a href=https://www.python.org/downloads>View instructions here.</a>
- Node.js/npm:&nbsp;&nbsp;<a href=https://nodejs.org/en>View instructions here.</a>

**Clone the repository and enter the main directory:**
   ```bash
   git clone https://github.com/arnavmazumder/car_RL.git
   cd car_RL
   ```


### Running Locally

These setup instructions are for Linux users. If you are not using a Linux distribution you may install Bash to follow along, or perform the instructions specific to your system.

1. **Install React/Game Client Dependencies and Run**

    In a new terminal window, run the following commands:
    <br>
   ```bash
   cd ./client
   npm install --no-audit
   npm run start
   ```

   Go to http://localhost:3000 on your browser to ensure you can view the client application.
   <br>
   <br>

2. **Run the Plotting Client**
    In a new terminal window, run the following commands:
    <br>

    ```bash
    cd ./plotting-client
    python3 plot_metrics.py
    ```

    This will open the plotting client, which will initially be a blank window It is recommended to have both the game client and plotting client open side by side or with split-screen.
    <br>
    <br>


3. **Run the Flask Server**
    In a new terminal window, run the following commands:
    <br>
   ```bash
   cd ./server
   python3 server.py
   ```
   <br>
 

### Usage

Once you have navigated to the game client, you should see a variety of options along with the game environment.

1. **Familiarize Yourself with the Game Enivironment**
    - Use the 'W', 'A', and 'D' keys to manually control the car, only when not training or running AI
    - You can press "Generate Track" to randomly generate a new track, only when not training or running AI
    - You can press "Respawn/Repel on Collision" to make the car return to the finish line every time it collides with the grass or just bounce back, only when not training or running AI
    - You can press "Display/Remove Sensors" to view/hide collision sensors and reward gates any time 
    - Gain familiarity with possible actions and environment behavior
    <br>


2. **Select Hyperparameters**
   - Use the provided text boxes to fill out the corresponding hyperparameters you would like to test
   - If you are unsure where to start, you can press "Fill Default" to view the default hyperparameters.
   - To reset you selection, press "Clear"
   - Once satisfied with your selection, press "Use Selected Hyperparameters" to update the server
   - Note that the server will initially be set to the default hyperparameters from "Fill Default"
   <br>

3. **Train a Model**
   - Press "Train" to begin training a Deep Q-network with the hyperparameters currently set on the server
   - During training, the plotting client should begin displaying the reward and loss plots, which will be updating every second
   - When you press "Stop", the training session will end and the model and training information will be embedded in two pickle files in the ```flask-server``` directory in the following form: ```modelName.pkl``` and ```modelName_data.pkl```.
   - <b>If you want to train another model, be sure to change the ```MODEL_NAME``` constant in ```server.py``` to prevent any pickle files from previous sessions to be overwritten</b>

   <br>


4. **Run a Model**
   - Press "Start AI" to run the last trained model in the track environment
   - Press "Stop AI" to stop running the trained model and reset the environment
   - If you have multiple models stored as pairs of pickle files in your ```flask-server``` directory, be sure to change the ```MODEL_NAME``` constant in ```server.py``` to the desired ```modelName``` that you want to run
   <br>

5. **Further Customizations**
    - For any trained model, you can programmatically access the Agent object (defined in ```Agent.py```), data used to train the agent, and metrics through the saved pickle files in python:
    <br>

        ```python
        import joblib

        agent = joblib.load('modelName.pkl')

        trainingInfo = joblib.load('modelName_data.pkl')
        loss_data = trainingInfo[0]
        reward_data = trainingInfo[1]
        replay_buffer = trainingInfo[2]
        ```
    <br>

    - To experiment with the game environment dynamics and reward function, please view ```car_RL/client/public/game.js```

    <br>

If you ran into any issues or have any questions, you can contact me at arnavmazumder2023@gmail.com.











import  torch
import torch.nn as nn
import torch.utils.data
import torch.nn.functional as F
import random
from collections import deque


class Agent:
    def __init__(self, num_hidden_layers, hidden_layer_size, epsilon, eps_decay, min_eps, gamma, targetRefreshRate, batch_size, learning_rate, initial_state):

        self.device = torch.device("cuda:0" if torch.cuda.is_available() else 'cpu')

        # initialize neural networks
        self.possible_actions = ('DownUp', 'DownDown', 'DownLeft', 'DownRight', 'UpUp', 'UpDown', 'UpLeft', 'UpRight', 'None')
        self.state_params = ('carPosX', 'carPosY', 'carSpeed', 'carAngle', 'N_trackDist', 'NE_trackDist', 'NW_trackDist', 'S_trackDist', 'SE_trackDist', 'SW_trackDist', 'E_trackDist', 'W_trackDist')
        self.qNet = DNN(num_hidden_layers, hidden_layer_size, self.state_params, self.possible_actions)
        self.targetNet = DNN(num_hidden_layers, hidden_layer_size, self.state_params, self.possible_actions)
        self.targetNet.load_state_dict(self.qNet.state_dict())
        self.targetNet.eval()

        # intialize hyperparameters
        self.epsilon = epsilon
        self.eps_decay = eps_decay
        self.min_eps = min_eps
        self.gamma = gamma
        self.targetRefreshRate = targetRefreshRate
        self.batch_size = batch_size
        self.optimizer = torch.optim.Adam(self.qNet.parameters(), lr=learning_rate)

        # constantly save the prev state and action; use step() when next state and reward aquired
        self.prevState = None
        self.prevAction = None

        # Agent memory and initial state
        self.replay_buffer = deque(capacity=10000)
        self.initial_state = initial_state

        # time-step and episode
        self.t = 1
        self.episode = 1


    
    def saveAsPrev(self, state, action, done):
        if done: self.prevState = self.initial_state
        else: self.prevState = state
        self.prevAction = action

    

    def selectAction(self, state, done):
        if done:
            state = self.initial_state

        # TODO: Use state to select action w greedy epsilon


    def step(self, curr_state, reward, done):

        # TODO: Preprocess

        self.replay_buffer.append((self.prevState, self.prevAction, reward, curr_state, done))
        
        if len(self.replay_buffer) > self.batch_size:
            self.train()
        
        if done:
            self.t = 1
            self.episode += 1
        else: 
            self.t += 1
        

    
    def train(self):
        batch = random.sample(self.replay_buffer, self.batch_size)
        states, actions, rewards, next_states, dones = zip(*batch)

        
        # Convert to PyTorch tensors
        states = torch.tensor(states, dtype=torch.float32)
        actions = torch.tensor(actions, dtype=torch.long)
        rewards = torch.tensor(rewards, dtype=torch.float32)
        next_states = torch.tensor(next_states, dtype=torch.float32)
        dones = torch.tensor(dones, dtype=torch.float32)
        
        # Compute current Q values
        q_values = self.qNet(states)
        q_values = q_values.gather(1, actions.unsqueeze(1)).squeeze(1)
        
        # Compute next Q values
        next_q_values = self.targetNet(next_states).max(1)[0]
        
        # Compute target Q values
        target_q_values = rewards + self.gamma * next_q_values * (1 - dones)
        
        # Compute loss
        loss = F.mse_loss(q_values, target_q_values)
        
        # Optimize the model
        self.optimizer.zero_grad()
        loss.backward()
        self.optimizer.step()

        # Refresh target network
        if (self.t % self.targetRefreshRate == 0):
            self.targetNet.load_state_dict(self.qNet.state_dict())
        


    def inferAction(self, state):
        pass


class DNN(nn.Module):
    def __init__(self, num_hidden_layers, hidden_layer_size, state_params, possible_actions):
        super(DNN, self).__init__()

        self.fcls = nn.ModuleList()
        input_size = len(state_params)
        output_size = len(possible_actions)

        self.fcls.append(nn.Linear(input_size, hidden_layer_size))

        for i in range(num_hidden_layers):
            self.fcls.append(nn.Linear(hidden_layer_size, hidden_layer_size))

        self.fcls.append(nn.Linear(hidden_layer_size, output_size))


    
    def forward(self, x):
        for i in range(len(self.fcls)-1):
            x = F.relu(self.fcls[i](x))
        x = torch.sigmoid(self.fcls[len(self.fcls)-1](x))
        return x

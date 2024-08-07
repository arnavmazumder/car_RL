import  torch
import torch.nn as nn
import torch.utils.data
import torch.nn.functional as F
import random
from collections import deque

class Agent:
    def __init__(self, num_hidden_layers, hidden_layer_size, epsilon, eps_decay, min_eps, gamma, targetRefreshRate, batch_size, learning_rate, initial_state, buffer_cap):

        self.device = torch.device("cuda:0" if torch.cuda.is_available() else 'cpu')

        # initialize neural networks
        self.possible_actions = ('UpSwitch', 'LeftSwitch', 'RightSwitch', 'None')
        self.action_to_index = {action: idx for idx, action in enumerate(self.possible_actions)}
        self.state_params = ('carX', 'carY', 'sineAngle', 'cosAngle', 'carSpeed', 'NE_trackDist', 'NW_trackDist', 'N_trackDist', 'S_trackDist', 'E_trackDist', 'W_trackDist', 'up', 'left', 'right')
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
        self.replay_buffer = deque(maxlen=buffer_cap)
        self.initial_state = initial_state

        # time-step and episode
        self.t = 1
        self.episode = 1
        self.curr_reward = 0

        # metrics
        self.losses = []
        self.rewards = []

        # heuristic mins and maxes
        self.min_vals = torch.tensor([20, 20, -1, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], dtype=torch.float32)
        self.max_vals = torch.tensor([1400, 640, 1, 1, 10, 800, 800, 800, 800, 800, 800, 1, 1, 1], dtype=torch.float32)


    
    def saveAsPrev(self, state, action):
        self.prevState = state
        self.prevAction = action

    

    def selectAction(self, state):

        val = random.random()
        if val < self.epsilon:
            action = random.choice(self.possible_actions)
        else:
            action = self.inferAction(state)
        
        self.epsilon = max(self.epsilon * self.eps_decay, self.min_eps)

        return action
    
    

    def inferAction(self, state):
        state_tensor = self.preprocess(state).unsqueeze(0)  # Add batch dimension
        q_values = self.qNet(state_tensor)
        action_index = torch.argmax(q_values).item()
        return self.possible_actions[action_index]



    def preprocess(self, state):
        for val in ('up', 'right', 'left'): state[val] = int(state[val])
        state_vals = [state[key] for key in self.state_params]
        state_tensor = torch.tensor(state_vals, dtype=torch.float32).to(self.device)

        state_tensor = (state_tensor - self.min_vals) / (self.max_vals - self.min_vals)

        return state_tensor.to(self.device)



    def step(self, currState, reward, done):

        ppPrevState = self.preprocess(self.prevState)
        ppCurrState = self.preprocess(currState)
        action_index = self.action_to_index[self.prevAction]

        self.replay_buffer.append((ppPrevState, action_index, reward, ppCurrState, done))
        
        if len(self.replay_buffer) > self.batch_size:
            self.train()
        
        self.curr_reward += (self.gamma ** self.t) * reward
        
        if done:
            self.t = 1
            self.episode += 1
            self.rewards.append(self.curr_reward)
            self.curr_reward = 0
        else: 
            self.t += 1
        


    
    def train(self):
        batch = random.sample(self.replay_buffer, self.batch_size)
        states, actions, rewards, next_states, dones = zip(*batch)
        
        # Convert to PyTorch tensors
        states = torch.stack(states).to(self.device)
        actions = torch.tensor(actions, dtype=torch.long).to(self.device)
        rewards = torch.tensor(rewards, dtype=torch.float32).to(self.device)
        next_states = torch.stack(next_states).to(self.device)
        dones = torch.tensor(dones, dtype=torch.float32).to(self.device)
        
        # Compute current Q values
        q_values = self.qNet(states)
        q_values = q_values.gather(1, actions.unsqueeze(1)).squeeze(1)
        
        # Compute next Q values
        next_q_values = self.targetNet(next_states).max(1)[0]
        
        # Compute target Q values
        target_q_values = rewards + self.gamma * next_q_values * (1 - dones)
        
        # Compute loss
        loss = F.mse_loss(q_values, target_q_values)
        print(f'Episode: {self.episode}, Time: {self.t}, Loss: {loss.item()}, Epsilon: {self.epsilon}, Memory: {len(self.replay_buffer) if self.replay_buffer else 'Stopped'}/100000000')
        self.losses.append(loss.item())

        
        # Optimize the model
        self.optimizer.zero_grad()
        loss.backward()
        torch.nn.utils.clip_grad_norm_(self.qNet.parameters(), 1)
        self.optimizer.step()

        # Refresh target network
        if (self.t % self.targetRefreshRate == 0):
            self.targetNet.load_state_dict(self.qNet.state_dict())
        




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
        x = self.fcls[-1](x)
        return x

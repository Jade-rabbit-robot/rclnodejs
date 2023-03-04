// Copyright (c) 2018 Intel Corporation. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

const rclnodejs = require('../index.js');
const nav2_msgs = rclnodejs.require('nav2_msgs/action/FollowWaypoints');
const GoalStatus = rclnodejs.require('action_msgs/msg/GoalStatus');

class NaviActionClient {
  constructor(node) {
    this._node = node;

    this._actionClient = new rclnodejs.ActionClient(
      node,
      'nav2_msgs/action/FollowWaypoints',
      'FollowWaypoints'
    );
  }

  async sendGoal() {
    var path = [
      {
        header: {
          stamp: {
            sec: 0,
            nanosec: 0,
          },
          frame_id: 'map',
        },
        pose: {
          position: {
            x: 5.0,
            y: -4.0,
            z: 0.0,
          },
          orientation: {
            x: 0.0,
            y: 0.0,
            z: 0.0,
            w: 1.0,
          },
        },
      },
      {
        header: {
          stamp: {
            sec: 0,
            nanosec: 0,
          },
          frame_id: 'map',
        },
        pose: {
          position: {
            x: 5.0,
            y: -1.0,
            z: 0.0,
          },
          orientation: {
            x: 0.0,
            y: 0.0,
            z: 0.0,
            w: 1.0,
          },
        },
      },
      {
        header: {
          stamp: {
            sec: 0,
            nanosec: 0,
          },
          frame_id: 'map',
        },
        pose: {
          position: {
            x: 0.0,
            y: 0.0,
            z: 0.0,
          },
          orientation: {
            x: 0.0,
            y: 0.0,
            z: 0.0,
            w: 1.0,
          },
        },
      },
    ];
    this._node.getLogger().info('Waiting for action server...');
    await this._actionClient.waitForServer();

    const goal = new nav2_msgs.Goal();

    goal.poses = path;

    this._node.getLogger().info('Sending goal request...');

    const goalHandle = await this._actionClient.sendGoal(goal, (feedback) =>
      this.feedbackCallback(feedback)
    );

    // Start a 2 second timer
    this._timer = this._node.createTimer(2000, () =>
      this.timerCallback(goalHandle)
    );

    if (!goalHandle.isAccepted()) {
      this._node.getLogger().info('Goal rejected');
      return;
    }

    this._node.getLogger().info('Goal accepted');

    const result = await goalHandle.getResult();

    if (goalHandle.isSucceeded()) {
      this._node
        .getLogger()
        .info(`Goal suceeded with result: ${result.missed_waypoints}`);
    } else {
      this._node
        .getLogger()
        .info(
          `Goal failed with status: missed waypoints:${result.missed_waypoints}`
        );
    }

    rclnodejs.shutdown();
  }

  feedbackCallback(feedback) {
    this._node
      .getLogger()
      .info(`Received feedback: ${feedback.current_waypoint}`);
  }

  async timerCallback(goalHandle) {
    this._node.getLogger().info('Canceling goal');
    // Cancel the timer
    this._timer.cancel();

    const response = await goalHandle.cancelGoal();

    if (response.goals_canceling.length > 0) {
      this._node.getLogger().info('Goal successfully canceled');
    } else {
      this._node.getLogger().info('Goal failed to cancel');
    }

    rclnodejs.shutdown();
  }
}

rclnodejs
  .init()
  .then(() => {
    const node = rclnodejs.createNode('action_client_example_node');
    const client = new NaviActionClient(node);

    client.sendGoal();

    rclnodejs.spin(node);
  })
  .catch((err) => {
    console.error(err);
  });

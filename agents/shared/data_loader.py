"""
Data loading functions extracted from AgentCoreMaintenanceAgent.load_data().
Each function returns a pandas DataFrame from the corresponding CSV in agents/shared/data/.
"""

import pandas as pd
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')


def load_tire_data():
    """Load tire wear data from CSV."""
    return pd.read_csv(os.path.join(DATA_DIR, 'tire_wear_data.csv'))


def load_motor_data():
    """Load motor sensor data from CSV."""
    return pd.read_csv(os.path.join(DATA_DIR, 'motor_sensor_data.csv'))


def load_inverter_data():
    """Load inverter sensor data from CSV."""
    return pd.read_csv(os.path.join(DATA_DIR, 'inverter_sensor_data.csv'))


def load_manual_data():
    """Load car manual specs from CSV."""
    return pd.read_csv(os.path.join(DATA_DIR, 'car_manual_specs.csv'))

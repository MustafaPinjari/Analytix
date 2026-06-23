import json
from channels.generic.websocket import AsyncWebsocketConsumer

class DashboardConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.dashboard_id = self.scope['url_route']['kwargs']['dashboard_id']
        self.room_group_name = f'dashboard_{self.dashboard_id}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'dashboard_event',
                'sender_channel_name': self.channel_name,
                'data': data
            }
        )

    # Receive message from room group
    async def dashboard_event(self, event):
        # Send the data to WebSocket
        # Only send if it didn't originate from this channel (optional, but let's broadcast to everyone including sender, or filter on frontend)
        # Let's include the sender channel name so frontend can filter if needed, or simply pass the data
        await self.send(text_data=json.dumps(event['data']))

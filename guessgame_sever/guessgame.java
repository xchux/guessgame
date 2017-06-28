package guessgame_sever;

/**************
 * guessgame
 ************* */
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.CharBuffer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServletRequest;

import org.json.*;
import org.apache.catalina.websocket.MessageInbound;
import org.apache.catalina.websocket.StreamInbound;
import org.apache.catalina.websocket.WebSocketServlet;
import org.apache.catalina.websocket.WsOutbound;

@WebServlet("/guessgame")
public class guessgame extends WebSocketServlet {
	private final AtomicInteger connectionIds = new AtomicInteger(0);
	private final List<ChatMessageInbound> connections = new ArrayList<ChatMessageInbound>();
	private final Map<Integer, String> IDAndUserName = new HashMap<Integer, String>();

	protected StreamInbound createWebSocketInbound(String sunProtocol, HttpServletRequest request) {
		return new ChatMessageInbound(connectionIds.incrementAndGet());
	}

	private final class ChatMessageInbound extends MessageInbound {
		private final int id;
		private boolean getUserName;
		private String userName;

		private ChatMessageInbound(int id) {
			getUserName = false;
			this.id = id;
		}

		protected void onOpen(WsOutbound outbound) {
			System.out.println("onOpen()");
			connections.add(this);
		}

		protected void onClose(int status) {
			connections.remove(this);
			String content = "has disconneted!";
			String to = "all";
			String message = "{\"from\":\"" + userName + "\",\"to\":\"" + to + "\",\"content\":\"" + content + "\"}";
			broadcast(to, message);
		}

		@Override
		protected void onBinaryMessage(ByteBuffer arg0) throws IOException {
		}

		@Override
		protected void onTextMessage(CharBuffer buffer) throws IOException {
			String message = buffer.toString();
			System.out.println("onTextMessage():" + message);
			handleMessage(message);
		}

		private void broadcast(String to, String message) {
			if (to.equals("all")) {
				for (ChatMessageInbound connection : connections) {
					CharBuffer buffer = CharBuffer.wrap(message);// %u8FD9%u4E2A%u53EA%u6709%u4E00%u4EFD%u62F7%u8D1D%uFF0C%u6BCF%u53D1%u4E00%u6B21%u8C03%u7528%u4E00%u6B21
					System.out.println("send to all:" + connection.userName);
					try {
						connection.getWsOutbound().writeTextMessage(buffer);
					} catch (IOException e) {
						e.printStackTrace();
					}
				}
			} else {
				boolean isfounded = false;
				for (ChatMessageInbound connection : connections) {
					CharBuffer buffer = CharBuffer.wrap(message);
					if (connection.userName.equals(to)) {
						System.out.println("connection.userName");
						isfounded = true;
						try {
							connection.getWsOutbound().writeTextMessage(buffer);
						} catch (IOException e) {
							e.printStackTrace();
						}
					}
				}
				if (!isfounded) {
					String content = "(System)" + to + " couldn't find!";
					String to1 = userName;
					String messagetemp = "{\"from\":\"" + userName + "\",\"to\":\"" + to1 + "\",\"content\":\""
							+ content + "\"}";
					CharBuffer buffer = CharBuffer.wrap(messagetemp);
					try {
						this.getWsOutbound().writeTextMessage(buffer);
					} catch (IOException e) { // TODO Auto-generated catch block
												// e.printStackTrace();
					}
				}
			}
		}

		private void handleMessage(String message) {
			JSONObject json = null;
			System.out.println(message);
			try {
				json = new JSONObject(message);
			} catch (JSONException e1) {
				// TODO Auto-generated catch block
				e1.printStackTrace();
			}
			String from = null;
			try {
				from = json.getString("from");
			} catch (JSONException e1) {
				// TODO Auto-generated catch block
				e1.printStackTrace();
			}
			String to = null;
			try {
				to = json.getString("to");
			} catch (JSONException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			} // String content =
												// json.getString("content");
			if (!getUserName) {
				this.userName = from;
				getUserName = true;
			}
			broadcast(to, message);
		}
	}
}

import { registerUserAction, loginUserAction } from "./app/actions/auth";

async function test() {
  console.log("Testing Signup...");
  const res = await registerUserAction({
    name: "Test User",
    phone: "1234567890",
    email: "test@example.com",
    username: "testuser",
    password: "password123"
  });
  console.log("Signup:", res);

  console.log("Testing Login...");
  const loginRes = await loginUserAction("testuser", "password123");
  console.log("Login:", loginRes);
}

test();

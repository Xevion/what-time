import { createFileRoute } from "@tanstack/react-router";
import { Container, Heading, Text, Button, Flex } from "@radix-ui/themes";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <Container size="3" style={{ paddingTop: "4rem" }}>
      <Flex direction="column" gap="4" align="center">
        <Heading size="9">when-works</Heading>
        <Text size="5" color="gray">
          Find the perfect time for group meetings
        </Text>
        <Flex gap="3" mt="4">
          <Button size="3">Create Event</Button>
          <Button size="3" variant="soft">
            Join Event
          </Button>
        </Flex>
      </Flex>
    </Container>
  );
}

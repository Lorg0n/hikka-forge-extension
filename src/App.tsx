import { Button } from "@/components/ui/button"

function App() {
  const logMessage = () => {
    console.log("Button clicked in Hikka Forge Extension!");
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-[300px] min-w-[300px]">
      <h1 className="text-xl font-bold mb-4">Hikka Forge Extension</h1>
      <Button onClick={logMessage}>Log to Console</Button>
    </div>
  )
}

export default App
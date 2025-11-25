import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase, Branch, UserRole } from "@/lib/supabase";
import { toast } from "sonner";
import { Eye, EyeOff, Sparkles } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Sign up states
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [branch, setBranch] = useState<Branch>("CSE");
  const [crCode, setCrCode] = useState("");
  
  // Sign in states
  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // If CR role, verify code first
      if (role === "cr") {
        const normalizedCode = crCode.trim();
        const { data: codeData, error: codeError } = await supabase
          .from("cr_codes")
          .select("*")
          .eq("branch", branch)
          .eq("code", normalizedCode)
          .maybeSingle();

        if (codeError || !codeData) {
          toast.error("Invalid CR code for selected branch");
          setIsLoading(false);
          return;
        }
      }

      const { error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name,
            role,
            branch,
          },
        },
      });

      if (error) throw error;

      toast.success("Account created! You can now sign in.");
      setIsLoading(false);
    } catch (error: any) {
      toast.error(error.message);
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: signinEmail,
        password: signinPassword,
      });

      if (error) throw error;

      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass p-8 hover-lift">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold gradient-text">CampusFlow</h1>
          </div>
          <p className="text-muted-foreground">Real-time classroom management</p>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  value={signinEmail}
                  onChange={(e) => setSigninEmail(e.target.value)}
                  required
                  className="glass"
                />
              </div>
              <div>
                <Label htmlFor="signin-password">Password</Label>
                <div className="relative">
                  <Input
                    id="signin-password"
                    type={showPassword ? "text" : "password"}
                    value={signinPassword}
                    onChange={(e) => setSigninPassword(e.target.value)}
                    required
                    className="glass pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full hover-glow" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="glass"
                />
              </div>
              <div>
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                  className="glass"
                />
              </div>
              <div>
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    minLength={6}
                    className="glass pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="branch">Branch</Label>
                <Select value={branch} onValueChange={(value) => setBranch(value as Branch)}>
                  <SelectTrigger className="glass">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CSE">CSE</SelectItem>
                    <SelectItem value="ECE">ECE</SelectItem>
                    <SelectItem value="IT">IT</SelectItem>
                    <SelectItem value="MECH">MECH</SelectItem>
                    <SelectItem value="CIVIL">CIVIL</SelectItem>
                    <SelectItem value="EEE">EEE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                  <SelectTrigger className="glass">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="cr">Class Representative (CR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {role === "cr" && (
                <div>
                  <Label htmlFor="cr-code">CR Verification Code</Label>
                  <Input
                    id="cr-code"
                    value={crCode}
                    onChange={(e) => setCrCode(e.target.value)}
                    required
                    placeholder={`Enter ${branch} CR code`}
                    className="glass"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Demo codes: CSE123, ECE456, IT789, MECH101, CIVIL202, EEE303
                  </p>
                </div>
              )}
              <Button type="submit" className="w-full hover-glow" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Sign Up"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;

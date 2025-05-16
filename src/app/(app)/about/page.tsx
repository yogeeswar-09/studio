
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mail, Users, BookOpenCheck } from "lucide-react"; // Added BookOpenCheck for Terms

export default function AboutUsPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-0">
      <ScrollArea className="h-[calc(100vh-var(--header-height,4rem)-4rem)] pr-4">
        <div className="space-y-12">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-primary">About CampusKart</CardTitle>
              <CardDescription className="text-lg text-muted-foreground pt-1">
                Your on-campus marketplace, built by students, for students.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-foreground/90">
              <p>
                CampusKart is an exclusive online marketplace designed for the students of MLRIT. Our platform facilitates the buying and selling of a wide range of items—from academic essentials like books, electronics, and lab equipment, to everyday student needs.
              </p>
              <p>
                We aim to foster a vibrant campus community by making it easy and safe for students to trade goods, find great deals, and declutter. By connecting students directly, CampusKart promotes sustainability and resourcefulness within our college.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-accent flex items-center">
                <Users className="mr-3 h-6 w-6" /> Our Team
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-foreground/90">
              <p>
                CampusKart was proudly developed by <strong className="text-primary">Team - Code Crafters</strong> from the Department of Computer Science and Engineering (CSM - B) at MLRIT.
              </p>
              <p>
                We are a group of passionate students dedicated to leveraging technology to solve real-world problems and enhance campus life. This project is a testament to our collaborative spirit and commitment to our fellow students.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-accent flex items-center">
                <Mail className="mr-3 h-6 w-6" /> Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-foreground/90">
              <p>
                Encountering issues or have suggestions? We'd love to hear from you!
              </p>
              <p>
                You can reach Team - Code Crafters at: <a href="mailto:Codecraftersmlr@gmail.com" className="text-primary hover:underline font-semibold">Codecraftersmlr@gmail.com</a>.
              </p>
              <p>
                Alternatively, you can typically find us in the <strong className="text-primary">CSM-B section labs</strong> during college hours, or you can reach out to one of our team representatives.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold flex items-center">
                 <BookOpenCheck className="mr-3 h-6 w-6 text-muted-foreground" /> Terms & Conditions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground/80">
                Welcome to CampusKart! By accessing or using our platform, you agree to comply with and be bound by the following terms and conditions of use. Please review them carefully. If you do not agree to these terms, you should not use this site.
              </p>
              
              <ol className="list-decimal list-inside space-y-3">
                <li>
                  <strong>Eligibility:</strong> This platform is exclusively for current students and faculty of MLRIT. Users must register with a valid <code>@mlrit.ac.in</code> email address. Verification of student status may be required.
                </li>
                <li>
                  <strong>User Conduct:</strong> Users are expected to conduct themselves honestly, respectfully, and in accordance with MLRIT's code of conduct. Misleading listings, spam, harassment, offensive content, or any illegal activities are strictly prohibited.
                </li>
                <li>
                  <strong>Listings:</strong> Sellers are solely responsible for the accuracy, legality, and quality of their listings. Items listed must be owned by the seller and appropriate for a student marketplace. CampusKart reserves the right to remove any listing deemed inappropriate or in violation of these terms without notice.
                </li>
                <li>
                  <strong>Transactions & Safety:</strong> All transactions are solely between the buyer and the seller. CampusKart is not a party to any transaction and is not responsible for any disputes, issues with items, payments, or fulfillment. We strongly recommend meeting in safe, public places on campus for exchanges and inspecting items thoroughly before purchase.
                </li>
                <li>
                  <strong>Prohibited Items:</strong> Listing illegal items, hazardous materials, counterfeit goods, services (unless explicitly permitted), or any items that violate college policy is strictly forbidden.
                </li>
                <li>
                  <strong>Privacy:</strong> Your privacy is important to us. We collect and use your data (name, email, year, branch, listings, chat messages) to provide and improve CampusKart. By using the platform, you consent to this. We do not sell your personal data to third parties. (A more detailed Privacy Policy can be added separately).
                </li>
                <li>
                  <strong>Disclaimer of Warranties:</strong> CampusKart provides this platform 'as is' and 'as available' without any warranties, express or implied. We do not guarantee the accuracy, completeness, or reliability of any content or listings.
                </li>
                <li>
                  <strong>Limitation of Liability:</strong> CampusKart and its developers (Team - Code Crafters) will not be liable for any direct, indirect, incidental, special, or consequential damages arising from the use or inability to use this platform.
                </li>
                <li>
                  <strong>Intellectual Property:</strong> The CampusKart name, logo, and platform design are the property of its developers. Users may not use these without permission. User-generated content remains the property of the user, but by posting, you grant CampusKart a license to display it.
                </li>
                <li>
                  <strong>Changes to Terms:</strong> We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Continued use of the platform after changes constitutes acceptance of the new terms.
                </li>
                <li>
                  <strong>Governing Law:</strong> These terms shall be governed by the laws of India, without regard to its conflict of law provisions.
                </li>
                <li>
                  <strong>Contact:</strong> For any questions regarding these terms, please contact us at <a href="mailto:Codecraftersmlr@gmail.com" className="text-primary hover:underline">Codecraftersmlr@gmail.com</a> or refer to the 'Contact Us' section above.
                </li>
              </ol>
              <Separator className="my-6" />
              <p className="text-xs text-center">
                These Terms & Conditions are a general template and may need to be reviewed by a legal professional for your specific needs and jurisdiction.
              </p>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}

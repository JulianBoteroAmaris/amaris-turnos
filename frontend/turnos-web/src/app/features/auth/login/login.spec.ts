import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { Login } from './login';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    sessionStorage.clear();

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);

    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  function llenarFormulario(usuario: string, password: string): void {
    const usuarioInput: HTMLInputElement = fixture.debugElement.query(
      By.css('#nombreUsuario'),
    ).nativeElement;
    usuarioInput.value = usuario;
    usuarioInput.dispatchEvent(new Event('input'));

    const passwordInput: HTMLInputElement = fixture.debugElement.query(
      By.css('#password'),
    ).nativeElement;
    passwordInput.value = password;
    passwordInput.dispatchEvent(new Event('input'));

    fixture.detectChanges();
  }

  function enviarFormulario(): void {
    const formEl: HTMLFormElement = fixture.debugElement.query(By.css('form')).nativeElement;
    formEl.dispatchEvent(new Event('submit'));
  }

  it('debería crearse', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('no envía la petición si el formulario es inválido', () => {
    enviarFormulario();

    httpMock.expectNone(`${environment.apiUrl}/auth/login`);

    fixture.detectChanges();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Ingresa el usuario');
    expect(texto).toContain('Ingresa la contraseña');
  });

  it('navega a la raíz cuando el login es exitoso', () => {
    const navigateSpy = vi.spyOn(router, 'navigateByUrl');

    llenarFormulario('admin', 'Admin123!');
    enviarFormulario();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.body).toEqual({ nombreUsuario: 'admin', password: 'Admin123!' });
    req.flush({ token: 'token-de-prueba', rol: 'Asesor' });

    expect(navigateSpy).toHaveBeenCalledWith('/');
  });

  it('navega a administrar-turnos cuando el login es exitoso y el rol es Administrador', () => {
    const navigateSpy = vi.spyOn(router, 'navigateByUrl');

    llenarFormulario('admin', 'Admin123!');
    enviarFormulario();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush({ token: 'token-de-prueba', rol: 'Administrador' });

    expect(navigateSpy).toHaveBeenCalledWith('/administrar-turnos');
  });

  it('muestra el error de la API cuando las credenciales son inválidas', () => {
    llenarFormulario('admin', 'incorrecta');
    enviarFormulario();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush({ mensaje: 'Credenciales inválidas.' }, { status: 401, statusText: 'Unauthorized' });

    fixture.detectChanges();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Credenciales inválidas.');
  });

  it('alterna el texto cosmético del modo administrador al hacer clic en el enlace', () => {
    const textoActual = () => (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(textoActual()).toContain('Bienvenido de nuevo');

    const enlace: HTMLButtonElement = fixture.debugElement.query(
      By.css('.enlace-modo'),
    ).nativeElement;
    enlace.click();
    fixture.detectChanges();

    expect(textoActual()).toContain('Acceso administrador');
  });
});
